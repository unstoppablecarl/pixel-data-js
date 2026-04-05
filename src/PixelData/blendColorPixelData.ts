import { type Color32, type ColorBlendOptions, type PixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'

/**
 * Blends a solid color into a target pixel buffer.
 * @returns true if any pixels were actually modified.
 */
export function blendColorPixelData(
  target: PixelData32,
  color: Color32,
  opts?: ColorBlendOptions,
): boolean {
  const targetX = opts?.x ?? 0
  const targetY = opts?.y ?? 0
  const width = opts?.w ?? target.width
  const height = opts?.h ?? target.height
  const globalAlpha = opts?.alpha ?? 255
  const blendFn = opts?.blendFn ?? sourceOverPerfect
  if (globalAlpha === 0) return false

  const baseSrcAlpha = (color >>> 24)
  const isOverwrite = (blendFn as any).isOverwrite || false

  if (baseSrcAlpha === 0 && !isOverwrite) return false

  // Clipping
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

  const actualW = Math.min(w, target.width - x)
  const actualH = Math.min(h, target.height - y)

  if (actualW <= 0 || actualH <= 0) return false

  // Single-color fills can pre-calculate the source color once
  let finalSrcColor = color

  if (globalAlpha < 255) {
    const a = (baseSrcAlpha * globalAlpha + 128) >> 8
    if (a === 0 && !isOverwrite) return false
    finalSrcColor = ((color & 0x00ffffff) | (a << 24)) >>> 0 as Color32
  }

  const dst32 = target.data32
  const dw = target.width
  let dIdx = (y * dw + x) | 0
  const dStride = (dw - actualW) | 0
  let didChange = false

  for (let iy = 0; iy < actualH; iy++) {
    for (let ix = 0; ix < actualW; ix++) {
      const current = dst32[dIdx] as Color32
      const next = blendFn(finalSrcColor, current)

      if (current !== next) {
        dst32[dIdx] = next
        didChange = true
      }

      dIdx++
    }
    dIdx += dStride
  }

  return didChange
}
