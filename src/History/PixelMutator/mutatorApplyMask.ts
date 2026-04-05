import { type ApplyMaskToPixelDataOptions, type Mask, MaskType } from '../../_types'
import { applyAlphaMaskToPixelData } from '../../PixelData/applyAlphaMaskToPixelData'
import { applyBinaryMaskToPixelData } from '../../PixelData/applyBinaryMaskToPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = {
  applyBinaryMaskToPixelData,
  applyAlphaMaskToPixelData,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorApplyMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyBinaryMaskToPixelData = defaults.applyBinaryMaskToPixelData,
    applyAlphaMaskToPixelData = defaults.applyAlphaMaskToPixelData,
  } = deps

  return {
    applyMask(mask: Mask, opts?: ApplyMaskToPixelDataOptions): boolean {
      const target = writer.config.target
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? target.w
      const h = opts?.h ?? target.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)

      if (mask.type === MaskType.BINARY) {
        return didChange(applyBinaryMaskToPixelData(target, mask, opts))
      } else {
        return didChange(applyAlphaMaskToPixelData(target, mask, opts))
      }
    },
  }
}) satisfies HistoryMutator<any, Deps>
