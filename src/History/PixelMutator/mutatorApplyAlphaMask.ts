import { type ApplyMaskToPixelDataOptions } from '../../_types'
import type { AlphaMask } from '../../Mask/_mask-types'
import { applyAlphaMaskToPixelData } from '../../PixelData/applyAlphaMaskToPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  applyAlphaMaskToPixelData,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyAlphaMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyAlphaMaskToPixelData = defaults.applyAlphaMaskToPixelData,
  } = deps

  return {
    applyAlphaMask(mask: AlphaMask, opts?: ApplyMaskToPixelDataOptions): boolean {
      const target = writer.config.target
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? target.w
      const h = opts?.h ?? target.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      return didChange(applyAlphaMaskToPixelData(target, mask, opts))
    },
  }
}) satisfies HistoryMutator<any, Deps>
