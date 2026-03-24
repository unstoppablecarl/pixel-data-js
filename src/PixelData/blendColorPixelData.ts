import { type Color32, type ColorBlendOptions, type IPixelData } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

export function blendColorPixelData(
  dst: IPixelData,
  color: Color32,
  opts: ColorBlendOptions = {},
) {
  const {
    x: targetX = 0,
    y: targetY = 0,
    w: width = dst.width,
    h: height = dst.height,
    alpha: globalAlpha = 255,
    blendFn = sourceOverPerfect,
  } = opts

  if (globalAlpha === 0) return
  const baseSrcAlpha = (color >>> 24)
  const isOverwrite = (blendFn as any).isOverwrite || false
  if (baseSrcAlpha === 0 && !isOverwrite) return

  // Clipping
  let x = targetX, y = targetY, w = width, h = height
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

  // Single-color fills can pre-calculate the source color once
  let finalSrcColor = color
  if (globalAlpha < 255) {
    const a = (baseSrcAlpha * globalAlpha + 128) >> 8
    if (a === 0 && !isOverwrite) return
    finalSrcColor = ((color & 0x00ffffff) | (a << 24)) >>> 0 as Color32
  }

  const dst32 = dst.data32
  const dw = dst.width
  let dIdx = (y * dw + x) | 0
  const dStride = (dw - actualW) | 0

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      dst32[dIdx] = blendFn(finalSrcColor, dst32[dIdx] as Color32)
      dIdx++
    }
    dIdx += dStride
  }
}
