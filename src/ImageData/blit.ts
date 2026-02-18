import type { BlendColor32, Color32 } from '../_types'
import { sourceOverColor32 } from './blend-modes'

export type BlendImageDataOptions = {
  dx?: number
  dy?: number
  sx?: number
  sy?: number
  sw?: number
  sh?: number
  opacity?: number
  alpha?: number
  mask?: Uint8Array | null
  maskMode?: 'binary' | 'alpha'
  blendFn?: BlendColor32
}

/**
 * Blits source ImageData into a destination ImageData using 32-bit integer bitwise blending.
 * * This function bypasses standard Canvas API limitations by operating directly on
 * Uint32Array views. It supports various blend modes, binary/alpha masking, and
 * automatic clipping of both source and destination bounds.
 * * @param dst - The destination ImageData to write into.
 * @param src - The source ImageData to read from.
 * @param dst - The destination ImageData to write to.
 * @param opts - Configuration for the blit operation.
 * @param opts.dx - Destination X offset. Defaults to 0.
 * @param opts.dy - Destination Y offset. Defaults to 0.
 * @param opts.sx - Source X offset. Defaults to 0.
 * @param opts.sy - Source Y offset. Defaults to 0.
 * @param opts.sw - Width of the source area to blit. Defaults to src.width.
 * @param opts.sh - Height of the source area to blit. Defaults to src.height.
 * @param opts.opacity - Global strength of the blit (0.0 to 1.0). Defaults to 1.0.
 * @param opts.alpha - Global strength of the blit (0 to 255). Overrides 'opacity' if provided.
 * @param opts.mask - An optional Uint8Array acting as a stencil or alpha mask.
 * Must match source dimensions.
 * @param opts.maskMode - 'binary' ignores pixels where mask is 0.
 * 'alpha' scales source alpha by mask value (0-255).
 * @param opts.blendFn - The math logic used to combine pixels.
 * Defaults to `sourceOverColor32`.
 * * @example
 * blendImageData32(ctx.getImageData(0,0,100,100), sprite, {
 * blendFn: COLOR_32_BLEND_MODES.multiply,
 * mask: brushMask,
 * maskMode: 'alpha'
 * });
 */
export function blendImageData(
  dst: ImageData,
  src: ImageData,
  opts: BlendImageDataOptions,
) {
  let {
    dx = 0,
    dy = 0,
    sx = 0,
    sy = 0,
    sw = src.width,
    sh = src.height,
    maskMode = 'alpha',
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

  const maskIsAlpha = maskMode === 'alpha'

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
        const m = mask[si]
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
