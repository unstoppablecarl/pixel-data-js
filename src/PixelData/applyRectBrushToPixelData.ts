import type { BlendColor32, Color32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { PixelData } from './PixelData'

/**
 * Applies a rectangular brush to pixel data, blending a color with optional falloff.
 *
 * @param target The PixelData to modify.
 * @param color The brush color.
 * @param centerX The center x-coordinate of the brush.
 * @param centerY The center y-coordinate of the brush.
 * @param brushWidth
 * @param brushHeight
 * @param alpha The overall opacity of the brush (0-255).
 * @default 255
 * @param fallOff A function that returns an alpha multiplier (0-1) based on the normalized distance (0-1) from the circle's center.
 * @param blendFn
 * @default sourceOverPerfect
 */
export function applyRectBrushToPixelData(
  target: PixelData,
  color: Color32,
  centerX: number,
  centerY: number,
  brushWidth: number,
  brushHeight: number,
  alpha = 255,
  fallOff?: (dist: number) => number,
  blendFn: BlendColor32 = sourceOverPerfect,
): void {
  const targetWidth = target.width
  const targetHeight = target.height
  const data32 = target.data32

  const rawStartX = Math.floor(centerX - brushWidth / 2)
  const rawStartY = Math.floor(centerY - brushHeight / 2)
  const endX = Math.min(targetWidth, rawStartX + brushWidth)
  const endY = Math.min(targetHeight, rawStartY + brushHeight)
  const startX = Math.max(0, rawStartX)
  const startY = Math.max(0, rawStartY)

  const baseColor = color & 0x00ffffff
  const constantSrc = ((alpha << 24) | baseColor) >>> 0 as Color32
  const invHalfW = 1 / (brushWidth / 2)
  const invHalfH = 1 / (brushHeight / 2)

  for (let py = startY; py < endY; py++) {
    const rowOffset = py * targetWidth
    const dy = Math.abs(py + 0.5 - centerY) * invHalfH

    for (let px = startX; px < endX; px++) {
      if (fallOff) {
        const dx = Math.abs(px + 0.5 - centerX) * invHalfW
        const dist = dx > dy ? dx : dy
        const fAlpha = (alpha * fallOff(dist)) | 0
        const src = ((fAlpha << 24) | baseColor) >>> 0 as Color32
        data32[rowOffset + px] = blendFn(src, data32[rowOffset + px] as Color32)
      } else {
        data32[rowOffset + px] = blendFn(constantSrc, data32[rowOffset + px] as Color32)
      }
    }
  }
}
