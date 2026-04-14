import type { Color32 } from '../../Color/_color-types'
import type { BinaryMask } from '../../Mask/_mask-types'
import { fillPixelDataBinaryMask } from '../../PixelData/fillPixelDataBinaryMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { fillPixelDataBinaryMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorFillBinaryMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelDataBinaryMask = defaults.fillPixelDataBinaryMask,
  } = deps

  return {
    fillBinaryMask(
      color: Color32,
      mask: BinaryMask,
      x = 0,
      y = 0,
    ): boolean {
      const didChange = writer.accumulator.storeRegionBeforeState(x, y, mask.w, mask.h)
      if (!didChange) return false
      return didChange(
        fillPixelDataBinaryMask(writer.config.target, color, mask, x, y),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
