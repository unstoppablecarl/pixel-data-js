import { type ApplyMaskToPixelDataOptions, type BinaryMask, type HistoryMutator } from '../../_types'
import { applyBinaryMaskToPixelData } from '../../PixelData/applyBinaryMaskToPixelData'
import { PixelWriter } from '../PixelWriter'

const defaults = {
  applyBinaryMaskToPixelData,
}

type Deps = Partial<typeof defaults>

export const mutatorApplyBinaryMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    applyBinaryMaskToPixelData = defaults.applyBinaryMaskToPixelData,
  } = deps

  return {
    applyBinaryMask: (mask: BinaryMask, opts: ApplyMaskToPixelDataOptions = {}) => {
      let target = writer.target
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = opts

      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      applyBinaryMaskToPixelData(target, mask, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>
