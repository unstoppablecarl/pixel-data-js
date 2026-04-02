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
    applyAlphaMask(mask: AlphaMask, opts: ApplyMaskToPixelDataOptions = {}): boolean {
      let target = writer.config.target
      const {
        x = 0,
        y = 0,
        w = target.width,
        h = target.height,
      } = opts

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      return didChange(applyAlphaMaskToPixelData(target, mask, opts))
    },
  }
}) satisfies HistoryMutator<any, Deps>
