import { type AnyMask, type BlendColor32, type Color32, type ImageDataLike, MaskType } from '../_types'
import { sourceOverColor32 } from './blend-modes'

export type BlendImageDataOptions = {
  /**
   * The x-coordinate in the destination image where the blend begins.
   * @default 0
   */
  dx?: number

  /**
   * The y-coordinate in the destination image where the blend begins.
   * @default 0
   */
  dy?: number

  /**
   * The x-coordinate of the top-left corner of the sub-rectangle
   * of the source image to extract.
   * @default 0
   */
  sx?: number

  /**
   * The y-coordinate of the top-left corner of the sub-rectangle
   * of the source image to extract.
   * @default 0
   */
  sy?: number

  /**
   * The width of the sub-rectangle of the source image to extract.
   * Defaults to the full remaining width of the source.
   */
  sw?: number

  /**
   * The height of the sub-rectangle of the source image to extract.
   * Defaults to the full remaining height of the source.
   */
  sh?: number

  /**
   * Overall layer opacity, typically ranging from 0.0 (transparent) to 1.0 (opaque).
   * @default 1.0
   */
  opacity?: number

  /**
   * Same as opacity but is 0-255 and faster when processing. If Present opacity is ignored.
   * @default undefined
   */
  alpha?: number

  /**
   * An optional alpha mask buffer.
   * The values in this array (0-255) determine the intensity of the blend
   * at each corresponding pixel.
   */
  mask?: AnyMask | null

  /**
   * The specific blending function/algorithm to use for pixel math
   * (e.g., Multiply, Screen, Overlay).
   */
  blendFn?: BlendColor32
};

/**
 * Blits source ImageData into a destination ImageData using 32-bit integer bitwise blending.
 * This function bypasses standard Canvas API limitations by operating directly on
 * Uint32Array views. It supports various blend modes, binary/alpha masking, and
 * automatic clipping of both source and destination bounds.
 * @example
 * blendImageData32(ctx.getImageData(0,0,100,100), sprite, {
 *   blendFn: COLOR_32_BLEND_MODES.multiply,
 *   mask: brushMask,
 *   maskMode: MaskMode.ALPHA
 * });
 */
export function blendImageData(
  dst: ImageDataLike,
  src: ImageDataLike,
  opts: BlendImageDataOptions,
) {
  let {
    dx = 0,
    dy = 0,
    sx = 0,
    sy = 0,
    sw = src.width,
    sh = src.height,
    opacity = 1,
    alpha,
    blendFn = sourceOverColor32,
    mask,
  } = opts

  // 1. Clip Source Area
  if (sx < 0) {
    dx -= sx
    sw += sx
    sx = 0
  }
  if (sy < 0) {
    dy -= sy
    sh += sy
    sy = 0
  }
  sw = Math.min(sw, src.width - sx)
  sh = Math.min(sh, src.height - sy)

  // 2. Clip Destination Area
  if (dx < 0) {
    sx -= dx
    sw += dx
    dx = 0
  }
  if (dy < 0) {
    sy -= dy
    sh += dy
    dy = 0
  }
  const actualW = Math.min(sw, dst.width - dx)
  const actualH = Math.min(sh, dst.height - dy)

  if (actualW <= 0 || actualH <= 0) return

  // 32-bit views of the same memory
  const dst32 = new Uint32Array(dst.data.buffer)
  const src32 = new Uint32Array(src.data.buffer)

  const dw = dst.width
  const sw_orig = src.width

  const gAlpha = alpha !== undefined
    ? (alpha | 0)
    : Math.round(opacity * 255)

  const maskIsAlpha = mask?.type === MaskType.ALPHA

  for (let iy = 0; iy < actualH; iy++) {
    const dRow = (iy + dy) * dw
    const sRow = (iy + sy) * sw_orig

    for (let ix = 0; ix < actualW; ix++) {
      const di = dRow + (ix + dx)
      const si = sRow + (ix + sx)

      let s = src32[si] as Color32
      let sa = (s >>> 24) & 0xFF

      // skip fully transparent pixel
      if (sa === 0) continue

      let activeWeight = gAlpha

      if (mask) {
        const m = mask.data[si]
        if (m === 0) continue
        activeWeight = maskIsAlpha ? (m * activeWeight + 128) >> 8 : activeWeight
      }

      if (activeWeight < 255) {
        sa = (sa * activeWeight + 128) >> 8
      }

      // If combined alpha is 0 after masking/opacity, skip the blend math
      if (sa === 0) continue

      // Re-pack source with final calculated alpha
      s = ((s & 0x00FFFFFF) | (sa << 24)) >>> 0 as Color32

      dst32[di] = blendFn(s, dst32[di] as Color32)
    }
  }
}
