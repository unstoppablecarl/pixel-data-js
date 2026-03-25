import type { AlphaMask, Color32, ColorBlendMaskOptions, IPixelData } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendColorPixelDataAlphaMask(
  dst: IPixelData,
  color: Color32,
  mask: AlphaMask,
  opts: ColorBlendMaskOptions,
) {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
    alpha: globalAlpha = 255,
    blendFn = sourceOverPerfect,
    mx = 0,
    my = 0,
    invertMask = false,
  } = opts

  if (globalAlpha === 0 || !mask) return

  const baseSrcAlpha = (color >>> 24)
  const isOverwrite = (blendFn as any).isOverwrite || false

  if (baseSrcAlpha === 0 && !isOverwrite) return

  let x = targetX
  let y = targetY
  let w = width
  let h = height

  if (x < 0) {
    w += x
    x = 0
  }

  if (y < 0) {
    h += y
    y = 0
  }

  const actualW = Math.min(w, dst.width - x)
  const actualH = Math.min(h, dst.height - y)

  if (actualW <= 0 || actualH <= 0) return

  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0

  const dst32 = dst.data32
  const dw = dst.width
  const mPitch = mask.w
  const maskData = mask.data

  let dIdx = (y * dw + x) | 0
  let mIdx = ((my + dy) * mPitch + (mx + dx)) | 0

  const dStride = (dw - actualW) | 0
  let mStride = (mPitch - actualW) | 0
  const isOpaque = globalAlpha === 255
  const colorRGB = color & 0x00ffffff

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const mVal = maskData[mIdx]
      const effM = invertMask ? 255 - mVal : mVal

      if (effM === 0) {
        dIdx++
        mIdx++
        continue
      }

      let weight = globalAlpha

      if (isOpaque) {
        weight = effM
      } else if (effM !== 255) {
        weight = (effM * globalAlpha + 128) >> 8
      }

      if (weight === 0) {
        dIdx++
        mIdx++
        continue
      }

      let finalCol = color

      if (weight < 255) {
        const a = (baseSrcAlpha * weight + 128) >> 8
        if (a === 0 && !isOverwrite) {
          dIdx++
          mIdx++
          continue
        }
        finalCol = (colorRGB | (a << 24)) >>> 0 as Color32
      }

      dst32[dIdx] = blendFn(finalCol, dst32[dIdx] as Color32)

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
}
