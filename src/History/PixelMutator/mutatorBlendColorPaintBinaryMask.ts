import { type Color32, type PaintBinaryMask } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  blendColorPixelDataBinaryMask,
}
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColorPaintBinaryMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendColorPixelDataBinaryMask = defaults.blendColorPixelDataBinaryMask,
  } = deps

  const OPTS = {
    x: 0,
    y: 0,
    blendFn: sourceOverPerfect,
    alpha: 255,
  }

  return {
    blendColorPaintBinaryMask(
      color: Color32,
      mask: PaintBinaryMask,
      x: number,
      y: number,
      alpha = 255,
      blendFn = sourceOverPerfect,
    ): boolean {
      const tx = x + mask.centerOffsetX
      const ty = y + mask.centerOffsetY

      const didChange = writer.accumulator.storeRegionBeforeState(tx, ty, mask.w, mask.h)

      OPTS.x = tx
      OPTS.y = ty
      OPTS.alpha = alpha
      OPTS.blendFn = blendFn

      return didChange(
        blendColorPixelDataBinaryMask(writer.config.target, color, mask, OPTS),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

