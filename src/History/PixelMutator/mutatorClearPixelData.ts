import type { Color32, Rect } from '../../_types'
import { fillPixelData } from '../../PixelData/fillPixelData'
import { PixelWriter } from '../PixelWriter'

export function mutatorClearPixelData(writer: PixelWriter<any>) {
  return {
    clear(
      rect: Partial<Rect> = {},
    ) {
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = rect
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      fillPixelData(writer.target, 0 as Color32, x, y, w, h)
    },
  }
}
