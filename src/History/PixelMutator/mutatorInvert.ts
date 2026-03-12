import type { PixelMutateOptions } from '../../_types'
import { invertPixelData } from '../../PixelData/invertPixelData'
import { PixelWriter } from '../PixelWriter'

export function mutatorInvert(writer: PixelWriter<any>) {
  return {
    invert(opts: PixelMutateOptions = {}) {
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = opts
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      invertPixelData(writer.target, opts)
    },
  }
}
