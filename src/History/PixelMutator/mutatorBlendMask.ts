import { type PixelBlendMaskOptions } from '../../_types'
import { type Mask, MaskType } from '../../Mask/_mask-types'
import type { PixelData32 } from '../../PixelData/_pixelData-types'
import { blendPixelDataAlphaMask } from '../../PixelData/blendPixelDataAlphaMask'
import { blendPixelDataBinaryMask } from '../../PixelData/blendPixelDataBinaryMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { blendPixelDataAlphaMask, blendPixelDataBinaryMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelDataAlphaMask = defaults.blendPixelDataAlphaMask,
    blendPixelDataBinaryMask = defaults.blendPixelDataBinaryMask,
  } = deps

  return {
    blendMask(
      src: PixelData32,
      mask: Mask,
      opts?: PixelBlendMaskOptions,
    ): boolean {
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? src.w
      const h = opts?.h ?? src.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      if (!didChange) return false

      if (mask.type === MaskType.BINARY) {
        return didChange(
          blendPixelDataBinaryMask(writer.config.target, src, mask, opts),
        )
      } else {
        return didChange(
          blendPixelDataAlphaMask(writer.config.target, src, mask, opts),
        )
      }
    },
  }
}) satisfies HistoryMutator<any, Deps>

