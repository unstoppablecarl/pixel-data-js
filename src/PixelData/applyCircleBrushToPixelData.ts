import type { BlendColor32, Color32, IPixelData, Rect } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { getCircleBrushOrPencilBounds } from '../Rect/getCircleBrushOrPencilBounds'

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
 * @param bounds precalculated result from {@link getCircleBrushOrPencilBounds}
 * @default sourceOverPerfect
 */
export function applyCircleBrushToPixelData(
  target: IPixelData,
  color: Color32,
  centerX: number,
  centerY: number,
  brushSize: number,
  alpha = 255,
  fallOff: (dist: number) => number,
  blendFn: BlendColor32 = sourceOverPerfect,
  bounds?: Rect,
): void {
  const targetWidth = target.width
  const targetHeight = target.height

  // Use provided bounds OR calculate them once
  const b = bounds ?? getCircleBrushOrPencilBounds(
    centerX,
    centerY,
    brushSize,
    targetWidth,
    targetHeight,
  )

  if (b.w <= 0 || b.h <= 0) return

  const data32 = target.data32
  const r = brushSize / 2
  const rSqr = r * r
  const invR = 1 / r

  const centerOffset = (brushSize % 2 === 0) ? 0.5 : 0

  const endX = b.x + b.w
  const endY = b.y + b.h

  // Anchor the math to the floor of the center for exact pixel art parity
  const fCenterX = Math.floor(centerX)
  const fCenterY = Math.floor(centerY)
  const baseSrcAlpha = (color >>> 24)
  const colorRGB = color & 0x00ffffff
  const isOpaque = alpha === 255
  const isOverwrite = (blendFn as any).isOverwrite

  for (let cy = b.y; cy < endY; cy++) {
    const relY = (cy - fCenterY) + centerOffset
    const dySqr = relY * relY
    const rowOffset = cy * targetWidth

    for (let cx = b.x; cx < endX; cx++) {
      const relX = (cx - fCenterX) + centerOffset
      const dSqr = relX * relX + dySqr

      if (dSqr <= rSqr) {
        const idx = rowOffset + cx
        let weight = alpha

        const strength = fallOff(1 - (Math.sqrt(dSqr) * invR))
        const maskVal = (strength * 255) | 0
        if (maskVal === 0) continue

        // Match Blitter's weight calculation exactly
        if (isOpaque) {
          weight = maskVal
        } else if (maskVal !== 255) {
          weight = (maskVal * alpha + 128) >> 8
        }

        // Match Blitter's final color calculation exactly
        let finalCol = color
        if (weight < 255) {
          const a = (baseSrcAlpha * weight + 128) >> 8
          if (a === 0 && !isOverwrite) continue
          finalCol = (colorRGB | (a << 24)) >>> 0 as Color32
        }

        data32[idx] = blendFn(finalCol, data32[idx] as Color32)
      }
    }
  }
}
