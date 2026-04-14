import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { Color32 } from '../../Color/_color-types'
import type { PaintAlphaMask } from '../../Paint/_paint-types'
import { blendColorPixelDataAlphaMask } from '../../PixelData/blendColorPixelDataAlphaMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  blendColorPixelDataAlphaMask,
}
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColorPaintAlphaMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendColorPixelDataAlphaMask = defaults.blendColorPixelDataAlphaMask,
  } = deps

  const OPTS = {
    x: 0,
    y: 0,
    blendFn: sourceOverPerfect,
    alpha: 255,
  }

  return {
    blendColorPaintAlphaMask(
      color: Color32,
      mask: PaintAlphaMask,
      x: number,
      y: number,
      alpha = 255,
      blendFn = sourceOverPerfect,
    ): boolean {
      const tx = x + mask.centerOffsetX
      const ty = y + mask.centerOffsetY

      const didChange = writer.accumulator.storeRegionBeforeState(tx, ty, mask.w, mask.h)
      if (!didChange) return false

      OPTS.x = tx
      OPTS.y = ty
      OPTS.alpha = alpha
      OPTS.blendFn = blendFn

      return didChange(
        blendColorPixelDataAlphaMask(writer.config.target, color, mask, OPTS),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

