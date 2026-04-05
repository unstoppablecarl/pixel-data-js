import type { PixelMutateOptions } from '../../_types'
import { invertPixelData } from '../../PixelData/invertPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

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
    invert(opts?: PixelMutateOptions) {
      const target = writer.config.target
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? target.w
      const h = opts?.h ?? target.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)

      return didChange(
        invertPixelData(target, opts),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
