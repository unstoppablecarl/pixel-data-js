import { type ApplyMaskToPixelDataOptions, type BinaryMask, type HistoryMutator } from '../../_types'
import { applyBinaryMaskToPixelData } from '../../PixelData/applyBinaryMaskToPixelData'
import { PixelWriter } from '../PixelWriter'

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
    applyBinaryMask(mask: BinaryMask, opts: ApplyMaskToPixelDataOptions = {}): boolean {
      let target = writer.config.target
      const {
        x = 0,
        y = 0,
        w = target.width,
        h = target.height,
      } = opts

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      return didChange(applyBinaryMaskToPixelData(target, mask, opts))
    },
  }
}) satisfies HistoryMutator<any, Deps>
