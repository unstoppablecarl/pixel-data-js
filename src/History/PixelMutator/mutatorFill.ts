import type { Color32, HistoryMutator, Rect } from '../../_types'
import { fillPixelData } from '../../PixelData/fillPixelData'
import { PixelWriter } from '../PixelWriter'

const defaults = { fillPixelData }
type Deps = Partial<typeof defaults>
export const mutatorFill = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelData = defaults.fillPixelData,
  } = deps

  return {
    fill(
      color: Color32,
      rect: Partial<Rect> = {},
    ) {
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = rect
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      fillPixelData(writer.target, color, x, y, w, h)
    },
  }
}) satisfies HistoryMutator<any, Deps>
