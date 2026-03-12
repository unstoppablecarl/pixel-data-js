import type { BlendColor32, Color32, Rect } from '../_types'
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
 * @param bounds precalculated result from {@link getCircleBrushBounds}
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
  bounds?: Rect,
): void {
  const targetWidth = target.width
  const targetHeight = target.height

  // Use provided bounds OR calculate them once
  const b = bounds ?? getCircleBrushBounds(
    centerX,
    centerY,
    brushSize,
    targetWidth,
    targetHeight
  )

  if (b.w <= 0 || b.h <= 0) return

  const data32 = target.data32
  const r = brushSize / 2
  const rSqr = r * r
  const invR = 1 / r

  const centerOffset = (brushSize % 2 === 0) ? 0.5 : 0
  const baseColor = color & 0x00ffffff
  const constantSrc = ((alpha << 24) | baseColor) >>> 0 as Color32

  const endX = b.x + b.w
  const endY = b.y + b.h

  // Anchor the math to the floor of the center for exact pixel art parity
  const fCenterX = Math.floor(centerX)
  const fCenterY = Math.floor(centerY)

  for (let cy = b.y; cy < endY; cy++) {
    const relY = (cy - fCenterY) + centerOffset
    const dySqr = relY * relY
    const rowOffset = cy * targetWidth

    for (let cx = b.x; cx < endX; cx++) {
      const relX = (cx - fCenterX) + centerOffset
      const dSqr = relX * relX + dySqr

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

export function getCircleBrushBounds(
  centerX: number,
  centerY: number,
  brushSize: number,
  targetWidth?: number,
  targetHeight?: number,
  out?: Rect,
): Rect {
  const r = brushSize / 2

  // These offsets match your getPerfectCircleCoords exactly
  const minOffset = -Math.ceil(r - 0.5)
  const maxOffset = Math.floor(r - 0.5)

  // start is inclusive, end is exclusive
  const startX = Math.floor(centerX + minOffset)
  const startY = Math.floor(centerY + minOffset)
  const endX = Math.floor(centerX + maxOffset) + 1
  const endY = Math.floor(centerY + maxOffset) + 1

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

  res.x = cStartX
  res.y = cStartY
  res.w = Math.max(0, cEndX - cStartX)
  res.h = Math.max(0, cEndY - cStartY)

  return res
}
