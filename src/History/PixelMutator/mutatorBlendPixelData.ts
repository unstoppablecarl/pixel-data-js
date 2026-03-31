import type { HistoryMutator, IPixelData, PixelBlendOptions } from '../../_types'
import { blendPixelData } from '../../PixelData/blendPixelData'
import { PixelWriter } from '../PixelWriter'

const defaults = { blendPixelData }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendPixelData = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelData = defaults.blendPixelData,
  } = deps

  return {
    blendPixelData(
      src: IPixelData,
      opts: PixelBlendOptions = {},
    ) {
      const {
        x = 0,
        y = 0,
        w = src.width,
        h = src.height,
      } = opts
      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      blendPixelData(writer.config.target, src, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>

