import type { BinaryMask, HistoryMutator, IPixelData, PixelBlendMaskOptions } from '../../_types'
import { blendPixelDataBinaryMask } from '../../PixelData/blendPixelDataBinaryMask'
import { PixelWriter } from '../PixelWriter'

const defaults = { blendPixelDataBinaryMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendPixelDataBinaryMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelDataBinaryMask = defaults.blendPixelDataBinaryMask,
  } = deps

  return {
    blendPixelDataBinaryMask(
      src: IPixelData,
      mask: BinaryMask,
      opts: PixelBlendMaskOptions = {},
    ) {
      const x = opts.x ?? 0
      const y = opts.y ?? 0
      const w = opts.w ?? src.width
      const h = opts.h ?? src.height

      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      blendPixelDataBinaryMask(writer.config.target, src, mask, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>

