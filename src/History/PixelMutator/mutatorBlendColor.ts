import type { Color32, ColorBlendOptions } from '../../_types'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { PixelWriter } from '../PixelWriter'

export function mutatorBlendColor(writer: PixelWriter<any>) {
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
}
