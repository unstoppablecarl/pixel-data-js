import type { BinaryMask, Color32, ColorBlendMaskOptions, IPixelData } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendColorPixelDataBinaryMask(
  dst: IPixelData,
  color: Color32,
  mask: BinaryMask,
  opts: ColorBlendMaskOptions = {},
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

  let baseColorWithGlobalAlpha = color

  if (globalAlpha < 255) {
    const a = (baseSrcAlpha * globalAlpha + 128) >> 8
    if (a === 0 && !isOverwrite) return
    baseColorWithGlobalAlpha = ((color & 0x00ffffff) | (a << 24)) >>> 0 as Color32
  }

  const dx = (x - targetX) | 0
  const dy = (y - targetY) | 0

  const dst32 = dst.data32
  const dw = dst.width
  const mPitch = mask.w
  const maskData = mask.data
  let dIdx = (y * dw + x) | 0
  let mIdx = ((my + dy) * mPitch + (mx + dx)) | 0

  const dStride = (dw - actualW) | 0
  const mStride = (mPitch - actualW) | 0
  const skipVal = invertMask ? 1 : 0

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      if (maskData[mIdx] === skipVal) {
        dIdx++
        mIdx++
        continue
      }

      dst32[dIdx] = blendFn(baseColorWithGlobalAlpha, dst32[dIdx] as Color32)

      dIdx++
      mIdx++
    }

    dIdx += dStride
    mIdx += mStride
  }
}
