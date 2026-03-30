import type { BlendColor32, Color32, HistoryMutator, Rect } from '../../_types'
import { applyCircleBrushToPixelData } from '../../PixelData/applyCircleBrushToPixelData'
import { getCircleBrushOrPencilBounds } from '../../Rect/getCircleBrushOrPencilBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  applyCircleBrushToPixelData,
  getCircleBrushOrPencilBounds,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyCircleBrush = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyCircleBrushToPixelData = defaults.applyCircleBrushToPixelData,
    getCircleBrushOrPencilBounds = defaults.getCircleBrushOrPencilBounds,

  } = deps

  const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

  return {
    applyCircleBrush(
      color: Color32,
      centerX: number,
      centerY: number,
      brushSize: number,
      alpha = 255,
      fallOff: (dist: number) => number,
      blendFn?: BlendColor32,
    ) {

      const bounds = getCircleBrushOrPencilBounds(
        centerX,
        centerY,
        brushSize,
        writer.target.width,
        writer.target.height,
        boundsOut,
      )

      const { x, y, w, h } = bounds

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
        bounds,
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
