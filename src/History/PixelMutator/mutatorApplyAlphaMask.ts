import { type AlphaMask, type ApplyMaskToPixelDataOptions, type HistoryMutator } from '../../_types'
import { applyAlphaMaskToPixelData } from '../../PixelData/applyAlphaMaskToPixelData'
import { PixelWriter } from '../PixelWriter'

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
    applyAlphaMask: (mask: AlphaMask, opts: ApplyMaskToPixelDataOptions = {}) => {
      let target = writer.target
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = opts

      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      applyAlphaMaskToPixelData(target, mask, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>
