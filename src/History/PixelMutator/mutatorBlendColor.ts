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
      const target = writer.config.target
      const {
        x = 0,
        y = 0,
        w = target.width,
        h = target.height,
      } = opts
      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      blendColorPixelData(target, color, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>
