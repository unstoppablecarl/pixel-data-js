import type { HistoryMutator, PixelMutateOptions } from '../../_types'
import { invertPixelData } from '../../PixelData/invertPixelData'
import { PixelWriter } from '../PixelWriter'

const defaults = { invertPixelData }
type Deps = Partial<typeof defaults>

export const mutatorInvert = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    invertPixelData = defaults.invertPixelData,
  } = deps

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
}) satisfies HistoryMutator<any, Deps>
