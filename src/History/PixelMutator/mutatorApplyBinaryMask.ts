import { type ApplyMaskToPixelDataOptions } from '../../_types'
import type { BinaryMask } from '../../Mask/_mask-types'
import { applyBinaryMaskToPixelData } from '../../PixelData/applyBinaryMaskToPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  applyBinaryMaskToPixelData,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyBinaryMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyBinaryMaskToPixelData = defaults.applyBinaryMaskToPixelData,
  } = deps

  return {
    applyBinaryMask(mask: BinaryMask, opts?: ApplyMaskToPixelDataOptions): boolean {
      const target = writer.config.target
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? target.w
      const h = opts?.h ?? target.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      if (!didChange) return false

      const b = applyBinaryMaskToPixelData(target, mask, opts)

      return didChange(b)
    },
  }
}) satisfies HistoryMutator<any, Deps>
