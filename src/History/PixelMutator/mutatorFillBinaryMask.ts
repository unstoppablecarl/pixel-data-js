import type { BinaryMask, Color32, HistoryMutator } from '../../_types'
import { fillPixelDataBinaryMask } from '../../PixelData/fillPixelDataBinaryMask'
import { PixelWriter } from '../PixelWriter'

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
      alpha = 255,
      x = 0,
      y = 0,
    ) {
      writer.accumulator.storeRegionBeforeState(x, y, mask.w, mask.h)
      fillPixelDataBinaryMask(writer.config.target, color, mask, alpha, x, y)
    },
  }
}) satisfies HistoryMutator<any, Deps>
