import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { Color32 } from '../../Color/_color-types'
import { MaskType } from '../../Mask/_mask-types'
import type { PaintMask, PaintRect } from '../../Paint/_paint-types'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { blendColorPixelDataAlphaMask } from '../../PixelData/blendColorPixelDataAlphaMask'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  blendColorPixelDataAlphaMask,
  blendColorPixelDataBinaryMask,
  blendColorPixelData,
}
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColorPaintMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendColorPixelDataBinaryMask = defaults.blendColorPixelDataBinaryMask,
    blendColorPixelDataAlphaMask = defaults.blendColorPixelDataAlphaMask,
    blendColorPixelData = defaults.blendColorPixelData,
  } = deps

  const OPTS = {
    x: 0,
    y: 0,
    blendFn: sourceOverPerfect,
    alpha: 255,
    w: undefined as number | undefined,
    h: undefined as number | undefined,
  }

  return {
    blendColorPaintMask(
      color: Color32,
      mask: PaintMask | PaintRect,
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
      OPTS.w = undefined
      OPTS.h = undefined

      if (mask.data) {
        if (mask.type === MaskType.BINARY) {
          return didChange(
            blendColorPixelDataBinaryMask(writer.config.target, color, mask, OPTS),
          )
        }
        return didChange(
          blendColorPixelDataAlphaMask(writer.config.target, color, mask, OPTS),
        )
      }

      OPTS.w = mask.w
      OPTS.h = mask.h

      return didChange(
        blendColorPixelData(writer.config.target, color, OPTS),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

