import type { BlendColor32, Color32, IPixelData, Rect } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { getRectBrushOrPencilBounds } from '../Rect/getRectBrushOrPencilBounds'

export function applyRectBrushToPixelData(
  target: IPixelData,
  color: Color32,
  centerX: number,
  centerY: number,
  brushWidth: number,
  brushHeight: number,
  alpha = 255,
  fallOff: (dist: number) => number,
  blendFn: BlendColor32 = sourceOverPerfect,
  bounds?: Rect,
): void {
  const targetWidth = target.width
  const targetHeight = target.height

  const b = bounds ?? getRectBrushOrPencilBounds(
    centerX,
    centerY,
    brushWidth,
    brushHeight,
    targetWidth,
    targetHeight,
  )

  if (b.w <= 0 || b.h <= 0) return

  const data32 = target.data32
  const baseColor = color & 0x00ffffff
  const baseSrcAlpha = color >>> 24
  const isOpaque = alpha === 255

  const invHalfW = 1 / (brushWidth / 2)
  const invHalfH = 1 / (brushHeight / 2)

  // Restore the pixel-art centering logic
  const centerOffsetX = (brushWidth % 2 === 0) ? 0.5 : 0
  const centerOffsetY = (brushHeight % 2 === 0) ? 0.5 : 0
  const fCenterX = Math.floor(centerX)
  const fCenterY = Math.floor(centerY)

  const endX = b.x + b.w
  const endY = b.y + b.h
  const isOverwrite = (blendFn as any).isOverwrite

  for (let py = b.y; py < endY; py++) {
    const rowOffset = py * targetWidth
    const dy = Math.abs((py - fCenterY) + centerOffsetY) * invHalfH

    for (let px = b.x; px < endX; px++) {
      const idx = rowOffset + px

      const dx = Math.abs((px - fCenterX) + centerOffsetX) * invHalfW
      const dist = dx > dy ? dx : dy

      const strength = fallOff(dist)
      const maskVal = (strength * 255) | 0

      if (maskVal <= 0) continue

      let weight = alpha

      if (isOpaque) {
        weight = maskVal
      } else if (maskVal !== 255) {
        weight = (maskVal * alpha + 128) >> 8
      }

      let finalCol = color

      if (weight < 255) {
        const a = (baseSrcAlpha * weight + 128) >> 8

        if (a === 0 && !isOverwrite) continue

        finalCol = ((a << 24) | baseColor) >>> 0 as Color32
      }

      data32[idx] = blendFn(finalCol, data32[idx] as Color32)
    }
  }
}
