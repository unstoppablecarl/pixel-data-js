import type { HistoryMutator, PixelMutateOptions } from '../../_types'
import { invertPixelData } from '../../PixelData/invertPixelData'
import { PixelWriter } from '../PixelWriter'

const defaults = { invertPixelData }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorInvert = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    invertPixelData = defaults.invertPixelData,
  } = deps

  return {
    invert(opts: PixelMutateOptions = {}) {
      const target = writer.config.target
      const {
        x = 0,
        y = 0,
        w = target.width,
        h = target.height,
      } = opts
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      invertPixelData(target, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>
