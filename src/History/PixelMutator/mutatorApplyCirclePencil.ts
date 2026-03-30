import type { BlendColor32, CircleBrushMask, Color32, HistoryMutator, Rect } from '../../_types'
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
 **/
export const mutatorApplyCirclePencil = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyCircleBrushToPixelData = defaults.applyCircleBrushToPixelData,
    getCircleBrushOrPencilBounds = defaults.getCircleBrushOrPencilBounds,
  } = deps

  const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

  return {
    applyCirclePencil(
      color: Color32,
      centerX: number,
      centerY: number,
      brush: CircleBrushMask,
      alpha = 255,
      blendFn?: BlendColor32,
    ) {

      const bounds = getCircleBrushOrPencilBounds(
        centerX,
        centerY,
        brush.size,
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
        brush,
        alpha,
        blendFn,
        bounds,
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
