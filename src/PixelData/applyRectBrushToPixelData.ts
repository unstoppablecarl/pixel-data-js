import type { BlendColor32, Color32, Rect } from '../_types'
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
 * @param bounds precalculated result from {@link getRectBrushBounds}
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
  bounds?: Rect,
): void {
  const targetWidth = target.width
  const targetHeight = target.height

  // Use provided bounds or compute once
  const b = bounds ?? getRectBrushBounds(
    centerX,
    centerY,
    brushWidth,
    brushHeight,
    targetWidth,
    targetHeight
  )

  if (b.w <= 0 || b.h <= 0) return

  const data32 = target.data32
  const baseColor = color & 0x00ffffff
  const constantSrc = ((alpha << 24) | baseColor) >>> 0 as Color32

  const invHalfW = 1 / (brushWidth / 2)
  const invHalfH = 1 / (brushHeight / 2)
  const endX = b.x + b.w
  const endY = b.y + b.h

  for (let py = b.y; py < endY; py++) {
    const rowOffset = py * targetWidth

    // Y-distance check for falloff (center of pixel to center of brush)
    const dy = fallOff ? Math.abs(py + 0.5 - centerY) * invHalfH : 0

    for (let px = b.x; px < endX; px++) {
      const idx = rowOffset + px

      if (fallOff) {
        const dx = Math.abs(px + 0.5 - centerX) * invHalfW
        const dist = dx > dy ? dx : dy

        const strength = fallOff(dist)
        const fAlpha = (alpha * strength) | 0
        const src = ((fAlpha << 24) | baseColor) >>> 0 as Color32

        data32[idx] = blendFn(src, data32[idx] as Color32)
      } else {
        data32[idx] = blendFn(constantSrc, data32[idx] as Color32)
      }
    }
  }
}

export function getRectBrushBounds(
  centerX: number,
  centerY: number,
  brushWidth: number,
  brushHeight: number,
  targetWidth?: number,
  targetHeight?: number,
  out?: Rect,
): Rect {
  const startX = Math.floor(centerX - brushWidth / 2)
  const startY = Math.floor(centerY - brushHeight / 2)
  const endX = startX + brushWidth
  const endY = startY + brushHeight

  const res = out ?? {
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  const cStartX = targetWidth !== undefined ? Math.max(0, startX) : startX
  const cStartY = targetHeight !== undefined ? Math.max(0, startY) : startY
  const cEndX = targetWidth !== undefined ? Math.min(targetWidth, endX) : endX
  const cEndY = targetHeight !== undefined ? Math.min(targetHeight, endY) : endY

  const w = cEndX - cStartX
  const h = cEndY - cStartY

  res.x = cStartX
  res.y = cStartY
  res.w = w < 0 ? 0 : w
  res.h = h < 0 ? 0 : h

  return res
}
