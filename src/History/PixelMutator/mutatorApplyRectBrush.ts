import type { BlendColor32, Color32, HistoryMutator, Rect } from '../../_types'
import { applyRectBrushToPixelData } from '../../PixelData/applyRectBrushToPixelData'
import { getRectBrushOrPencilBounds } from '../../Rect/getRectBrushOrPencilBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  applyRectBrushToPixelData,
  getRectBrushOrPencilBounds,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyRectBrush = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyRectBrushToPixelData = defaults.applyRectBrushToPixelData,
    getRectBrushOrPencilBounds = defaults.getRectBrushOrPencilBounds,
  } = deps

  const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

  return {
    applyRectBrush(
      color: Color32,
      centerX: number,
      centerY: number,
      brushWidth: number,
      brushHeight: number,
      alpha = 255,
      fallOff: (dist: number) => number,
      blendFn?: BlendColor32,
    ) {

      const target = writer.config.target
      const bounds = getRectBrushOrPencilBounds(
        centerX,
        centerY,
        brushWidth,
        brushHeight,
        target.width,
        target.height,
        boundsOut,
      )

      const { x, y, w, h } = bounds

      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      applyRectBrushToPixelData(
        target,
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
}) satisfies HistoryMutator<any, Deps>
