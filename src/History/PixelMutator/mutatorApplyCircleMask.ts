import type { BlendColor32, CircleMask, Color32, ColorBlendMaskOptions, HistoryMutator, Rect } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
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
 */
export const mutatorApplyCircleMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyCircleMaskToPixelData = defaults.applyCircleMaskToPixelData,
    getCircleBrushOrPencilBounds = defaults.getCircleBrushOrPencilBounds,

  } = deps

  const boundsOut: Rect = { x: 0, y: 0, w: 0, h: 0 }

  const blendColorPixelOptions: ColorBlendMaskOptions = {
    alpha: 255,
    blendFn: sourceOverPerfect,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  return {
    applyCircleMask(
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
        blendColorPixelOptions,
        bounds,
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
