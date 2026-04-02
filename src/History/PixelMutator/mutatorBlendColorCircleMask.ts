import type { BlendColor32, CircleMask, Color32, ColorBlendMaskOptions, HistoryMutator, Rect } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { blendColorPixelDataCircleMask } from '../../PixelData/blendColorPixelDataCircleMask'
import { getCircleBrushOrPencilBounds } from '../../Rect/getCircleBrushOrPencilBounds'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  blendColorPixelDataCircleMask,
  getCircleBrushOrPencilBounds,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColorCircleMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    blendColorPixelDataCircleMask = defaults.blendColorPixelDataCircleMask,
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
    ): boolean {

      const target = writer.config.target
      const b = getCircleBrushOrPencilBounds(
        centerX,
        centerY,
        brush.size,
        target.width,
        target.height,
        boundsOut,
      )

      const didChange = writer.accumulator.storeRegionBeforeState(b.x, b.y, b.w, b.h)
      return didChange(
        blendColorPixelDataCircleMask(
          target,
          color,
          centerX,
          centerY,
          brush,
          alpha,
          blendFn,
          blendColorPixelOptions,
          b,
        ),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
