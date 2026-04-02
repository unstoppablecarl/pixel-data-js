import { type AlphaMask, type Color32, type IPixelData32, type PixelBlendMaskOptions } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendPixelDataAlphaMask(
  dst: IPixelData32,
  src: IPixelData32,
  alphaMask: AlphaMask,
  opts: PixelBlendMaskOptions = {},
): boolean {
  const {
    x: targetX = 0,
    y: targetY = 0,
    sx: sourceX = 0,
    sy: sourceY = 0,
    w: width = src.width,
    h: height = src.height,
    alpha: globalAlpha = 255,
    blendFn = sourceOverPerfect,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0) return false

  let x = targetX
  let y = targetY
  let sx = sourceX
  let sy = sourceY
  let w = width
  let h = height

  // 1. Clipping (Matches main branch behavior)
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

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)
  if (actualW <= 0 || actualH <= 0) return false

  // 2. Index Setup
  const dw = dst.width
  const sw = src.width
  const mPitch = alphaMask.w
  const maskData = alphaMask.data

  // dx/dy is the displacement from requested start to clipped start.
  // This keeps the mask locked to the source content during cross-clipping.
  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0

  const dst32 = dst.data32
  const src32 = src.data32

  let dIdx = (y * dw + x) | 0
  let sIdx = (sy * sw + sx) | 0
  let mIdx = ((my + dy) * mPitch + (mx + dx)) | 0

  const dStride = (dw - actualW) | 0
  const sStride = (sw - actualW) | 0
  const mStride = (mPitch - actualW) | 0

  const isOpaque = globalAlpha === 255
  const isOverwrite = blendFn.isOverwrite || false
  let didChange = false

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const mVal = maskData[mIdx]
      const effM = invertMask ? 255 - mVal : mVal

      // Early exit if mask is fully transparent
      if (effM === 0) {
        dIdx++
        sIdx++
        mIdx++
        continue
      }

      const srcCol = src32[sIdx] as Color32
      const srcAlpha = srcCol >>> 24

      // Early exit if source is fully transparent (unless overwriting)
      if (srcAlpha === 0 && !isOverwrite) {
        dIdx++
        sIdx++
        mIdx++
        continue
      }

      // Calculate weight using linear logic (Easier for JIT than nested ternaries)
      let weight = globalAlpha
      if (isOpaque) {
        weight = effM
      } else if (effM !== 255) {
        weight = (effM * globalAlpha + 128) >> 8
      }

      // Zero-weight safety check
      if (weight === 0) {
        dIdx++
        sIdx++
        mIdx++
        continue
      }

      let finalCol = srcCol
      if (weight < 255) {
        const a = (srcAlpha * weight + 128) >> 8
        // Final check: weight might have resulted in a transparent pixel
        if (a === 0 && !isOverwrite) {
          dIdx++
          sIdx++
          mIdx++
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
      mIdx++
    }
    dIdx += dStride
    sIdx += sStride
    mIdx += mStride
  }

  return didChange
}
