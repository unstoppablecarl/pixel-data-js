import { type Color32, MaskType, type PaintMask } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import { blendColorPixelDataAlphaMask } from '../../PixelData/blendColorPixelDataAlphaMask'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  blendColorPixelDataAlphaMask,
  blendColorPixelDataBinaryMask,
}
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColorPaintMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendColorPixelDataBinaryMask = defaults.blendColorPixelDataBinaryMask,
    blendColorPixelDataAlphaMask = defaults.blendColorPixelDataAlphaMask,
  } = deps

  const OPTS = {
    x: 0,
    y: 0,
    blendFn: sourceOverPerfect,
    alpha: 255,
  }

  return {
    blendColorPaintMask(
      color: Color32,
      mask: PaintMask,
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

      if (mask.type === MaskType.BINARY) {
        return didChange(
          blendColorPixelDataBinaryMask(writer.config.target, color, mask, OPTS),
        )
      } else {
        return didChange(
          blendColorPixelDataAlphaMask(writer.config.target, color, mask, OPTS),
        )
      }
    },
  }
}) satisfies HistoryMutator<any, Deps>

