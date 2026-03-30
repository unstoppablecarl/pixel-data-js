import type { Color32, ColorBlendOptions, HistoryMutator } from '../../_types'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { PixelWriter } from '../PixelWriter'

const defaults = { blendColorPixelData }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendColor = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    blendColorPixelData = defaults.blendColorPixelData,
  } = deps

  return {
    blendColor(
      color: Color32,
      opts: ColorBlendOptions = {},
    ) {
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = opts
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      blendColorPixelData(writer.target, color, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>
