import type { BlendColor32, Color32, Rect } from '../../_types'
import { applyCircleBrushToPixelData, getCircleBrushBounds } from '../../PixelData/applyCircleBrushToPixelData'
import { PixelWriter } from '../PixelWriter'

const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

export function mutatorApplyCircleBrush(writer: PixelWriter<any>) {
  return {
    applyCircleBrush(
      color: Color32,
      centerX: number,
      centerY: number,
      brushSize: number,
      alpha = 255,
      fallOff?: (dist: number) => number,
      blendFn?: BlendColor32,
    ) {

      const circleBounds = getCircleBrushBounds(
        centerX,
        centerY,
        brushSize,
        writer.target.width,
        writer.target.height,
        boundsOut,
      )

      const { x, y, w, h } = circleBounds

      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      applyCircleBrushToPixelData(
        writer.target,
        color,
        centerX,
        centerY,
        brushSize,
        alpha,
        fallOff,
        blendFn,
        circleBounds,
      )
    },
  }
}
