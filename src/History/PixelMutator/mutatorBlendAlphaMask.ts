import type { PixelBlendMaskOptions } from '../../_types'
import type { AlphaMask } from '../../Mask/_mask-types'
import type { PixelData32 } from '../../PixelData/_pixelData-types'
import { blendPixelDataAlphaMask } from '../../PixelData/blendPixelDataAlphaMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { blendPixelDataAlphaMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendAlphaMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelDataAlphaMask = defaults.blendPixelDataAlphaMask,
  } = deps

  return {
    blendAlphaMask(
      src: PixelData32,
      mask: AlphaMask,
      opts?: PixelBlendMaskOptions,
    ): boolean {
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? src.w
      const h = opts?.h ?? src.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      if (!didChange) return false

      return didChange(
        blendPixelDataAlphaMask(writer.config.target, src, mask, opts),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

