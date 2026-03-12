import type { BlendColor32, Color32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import type { PixelData } from './PixelData'

/**
 * Applies a circular brush to pixel data, blending a color with optional falloff.
 *
 * @param target The PixelData to modify.
 * @param color The brush color.
 * @param centerX The center x-coordinate of the brush.
 * @param centerY The center y-coordinate of the brush.
 * @param brushSize The diameter of the brush.
 * @param alpha The overall opacity of the brush (0-255).
 * @default 255
 * @param fallOff A function that returns an alpha multiplier (0-1) based on the normalized distance (0-1) from the circle's center.
 * @param blendFn
 * @default sourceOverPerfect
 */
export function applyCircleBrushToPixelData(
  target: PixelData,
  color: Color32,
  centerX: number,
  centerY: number,
  brushSize: number,
  alpha = 255,
  fallOff?: (dist: number) => number,
  blendFn: BlendColor32 = sourceOverPerfect,
): void {
  const r = brushSize / 2
  const rSqr = r * r
  const centerOffset = (brushSize % 2 === 0) ? 0.5 : 0

  const xStart = Math.max(0, Math.ceil(centerX - r))
  const xEnd = Math.min(target.width - 1, Math.floor(centerX + r))
  const yStart = Math.max(0, Math.ceil(centerY - r))
  const yEnd = Math.min(target.height - 1, Math.floor(centerY + r))

  const data32 = target.data32
  const targetWidth = target.width
  const baseColor = color & 0x00ffffff
  const invR = 1 / r

  // Pre-calculate the constant source for cases where fallOff is null
  const constantSrc = ((alpha << 24) | baseColor) >>> 0 as Color32

  for (let cy = yStart; cy <= yEnd; cy++) {
    const dy = cy - centerY + centerOffset
    const dySqr = dy * dy
    const rowOffset = cy * targetWidth

    for (let cx = xStart; cx <= xEnd; cx++) {
      const dx = cx - centerX + centerOffset
      const dSqr = dx * dx + dySqr

      if (dSqr <= rSqr) {
        const idx = rowOffset + cx

        if (fallOff) {
          const strength = fallOff(Math.sqrt(dSqr) * invR)
          const fAlpha = (alpha * strength) & 0xFF
          const src = ((fAlpha << 24) | baseColor) >>> 0 as Color32
          data32[idx] = blendFn(src, data32[idx] as Color32)
        } else {
          data32[idx] = blendFn(constantSrc, data32[idx] as Color32)
        }
      }
    }
  }
}
