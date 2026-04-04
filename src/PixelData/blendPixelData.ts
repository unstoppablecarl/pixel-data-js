import { type Color32, type IPixelData32, type PixelBlendOptions } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

/**
 * Blits source PixelData into a destination PixelData using 32-bit integer bitwise blending.
 * This function bypasses standard ImageData limitations by operating directly on
 * Uint32Array views. It supports various blend modes, binary/alpha masking, and
 * automatic clipping of both source and destination bounds.
 * @example
 *
 * const dst = new PixelData(ctx.getImageData(0,0,100,100))
 * blendImageData32(dst, sprite, {
 *   blendFn: COLOR_32_BLEND_MODES.multiply,
 *   mask: brushMask,
 *   maskType: MaskType.ALPHA
 * });
 */
export function blendPixelData(
  target: IPixelData32,
  src: IPixelData32,
  opts?: PixelBlendOptions,
): boolean {
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const sourceX = opts?.sx ?? 0
  const sourceY = opts?.sy ?? 0
  const width = opts?.w ?? src.width
  const height = opts?.h ?? src.height
  const globalAlpha = opts?.alpha ?? 255
  const blendFn = opts?.blendFn ?? sourceOverPerfect

  if (globalAlpha === 0) return false

  let x = targetX
  let y = targetY
  let sx = sourceX
  let sy = sourceY
  let w = width
  let h = height

  if (sx < 0) {
    x -= sx
    w += sx
    sx = 0
  }
  if (sy < 0) {
    y -= sy
    h += sy
    sy = 0
  }
  w = Math.min(w, src.width - sx)
  h = Math.min(h, src.height - sy)
  if (x < 0) {
    sx -= x
    w += x
    x = 0
  }
  if (y < 0) {
    sy -= y
    h += y
    y = 0
  }

  const actualW = Math.min(w, target.width - x)
  const actualH = Math.min(h, target.height - y)
  if (actualW <= 0 || actualH <= 0) return false

  const dst32 = target.data32
  const src32 = src.data32
  const dw = target.width
  const sw = src.width

  let dIdx = (y * dw + x) | 0
  let sIdx = (sy * sw + sx) | 0

  const dStride = (dw - actualW) | 0
  const sStride = (sw - actualW) | 0
  const isOpaque = globalAlpha === 255
  const isOverwrite = blendFn.isOverwrite
  let didChange = false

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const srcCol = src32[sIdx] as Color32
      const srcAlpha = (srcCol >>> 24)

      if (srcAlpha === 0 && !isOverwrite) {
        dIdx++
        sIdx++
        continue
      }

      let finalCol = srcCol
      if (!isOpaque) {
        const a = (srcAlpha * globalAlpha + 128) >> 8
        if (a === 0 && !isOverwrite) {
          dIdx++
          sIdx++
          continue
        }
        finalCol = ((srcCol & 0x00ffffff) | (a << 24)) >>> 0 as Color32
      }

      const current = dst32[dIdx] as Color32
      const next = blendFn(finalCol, dst32[dIdx] as Color32)

      if (current !== next) {
        dst32[dIdx] = next
        didChange = true
      }

      dIdx++
      sIdx++
    }
    dIdx += dStride
    sIdx += sStride
  }

  return didChange
}
