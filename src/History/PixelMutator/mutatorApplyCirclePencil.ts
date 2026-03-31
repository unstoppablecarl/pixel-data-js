import type { BlendColor32, CircleMask, Color32, HistoryMutator, Rect } from '../../_types'
import { applyCircleMaskToPixelData } from '../../PixelData/applyCircleMaskToPixelData'
import { getCircleBrushOrPencilBounds } from '../../Rect/getCircleBrushOrPencilBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  applyCircleMaskToPixelData,
  getCircleBrushOrPencilBounds,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 **/
export const mutatorApplyCirclePencil = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyCircleMaskToPixelData = defaults.applyCircleMaskToPixelData,
    getCircleBrushOrPencilBounds = defaults.getCircleBrushOrPencilBounds,
  } = deps

  const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

  return {
    applyCirclePencil(
      color: Color32,
      centerX: number,
      centerY: number,
      brush: CircleMask,
      alpha = 255,
      blendFn?: BlendColor32,
    ) {

      const target = writer.config.target
      const bounds = getCircleBrushOrPencilBounds(
        centerX,
        centerY,
        brush.size,
        target.width,
        target.height,
        boundsOut,
      )

      const { x, y, w, h } = bounds

      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      applyCircleMaskToPixelData(
        target,
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
