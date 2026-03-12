import { type AnyMask, type ApplyMaskOptions } from '../../_types'
import { applyMaskToPixelData } from '../../PixelData/applyMaskToPixelData'
import { PixelWriter } from '../PixelWriter'

export function mutatorApplyMask(writer: PixelWriter<any>) {
  return {
    applyMask: (mask: AnyMask, opts: ApplyMaskOptions = {}) => {
      let target = writer.target
      const {
        x = 0,
        y = 0,
        w = writer.target.width,
        h = writer.target.height,
      } = opts

      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      applyMaskToPixelData(target, mask, opts)
    },
  }
}
