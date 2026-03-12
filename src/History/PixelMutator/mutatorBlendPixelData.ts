import type { PixelBlendOptions } from '../../_types'
import { blendPixelData } from '../../PixelData/blendPixelData'
import type { PixelData } from '../../PixelData/PixelData'
import { PixelWriter } from '../PixelWriter'

export function mutatorBlendPixelData(writer: PixelWriter<any>) {
  return {
    blendPixelData(
      src: PixelData,
      opts: PixelBlendOptions,
    ) {
      const {
        x = 0,
        y = 0,
        w = src.width,
        h = src.height,
      } = opts
      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      blendPixelData(writer.target, src, opts)
    },
  }
}

