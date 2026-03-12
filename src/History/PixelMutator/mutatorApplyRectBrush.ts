import type { BlendColor32, Color32, Rect } from '../../_types'
import { applyRectBrushToPixelData, getRectBrushBounds } from '../../PixelData/applyRectBrushToPixelData'
import { PixelWriter } from '../PixelWriter'

const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

export function mutatorApplyRectBrush(writer: PixelWriter<any>) {
  return {
    applyRectBrush(
      color: Color32,
      centerX: number,
      centerY: number,
      brushWidth: number,
      brushHeight: number,
      alpha = 255,
      fallOff?: (dist: number) => number,
      blendFn?: BlendColor32,
    ) {

      const bounds = getRectBrushBounds(
        centerX,
        centerY,
        brushWidth,
        brushHeight,
        writer.target.width,
        writer.target.height,
        boundsOut,
      )

      const { x, y, w, h } = bounds

      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      applyRectBrushToPixelData(
        writer.target,
        color,
        centerX,
        centerY,
        brushWidth,
        brushHeight,
        alpha,
        fallOff,
        blendFn,
        bounds,
      )
    },
  }
}
