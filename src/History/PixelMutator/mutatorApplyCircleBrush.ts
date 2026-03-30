import type {
  BlendColor32,
  CircleBrushAlphaMask,
  Color32,
  ColorBlendMaskOptions,
  HistoryMutator,
  Rect,
} from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
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

  const blendColorPixelOptions: ColorBlendMaskOptions = {
    alpha: 255,
    blendFn: sourceOverPerfect,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  return {
    applyCircleBrush(
      color: Color32,
      centerX: number,
      centerY: number,
      brush: CircleBrushAlphaMask,
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
        blendColorPixelOptions,
        bounds,
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
