import type { BinaryMask, Color32, HistoryMutator, Rect } from '../../_types'
import { fillPixelDataBinaryMask } from '../../PixelData/fillPixelDataBinaryMask'
import { PixelWriter } from '../PixelWriter'

const defaults = { fillPixelDataBinaryMask }
type Deps = Partial<typeof defaults>
export const mutatorFillBinaryMask = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelDataBinaryMask = defaults.fillPixelDataBinaryMask,
  } = deps

  return {
    fillBinaryMask(
      color: Color32,
      mask: BinaryMask,
      rect: Partial<Rect> = {},
    ) {
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = rect
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      fillPixelDataBinaryMask(writer.target, color, mask, x, y, w, h)
    },
  }
}) satisfies HistoryMutator<any, Deps>
