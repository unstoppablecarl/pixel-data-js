import type { AlphaMask, HistoryMutator, IPixelData, PixelBlendMaskOptions } from '../../_types'
import { blendPixelDataAlphaMask } from '../../PixelData/blendPixelDataAlphaMask'
import { PixelWriter } from '../PixelWriter'

const defaults = { blendPixelDataAlphaMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendPixelDataAlphaMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelDataAlphaMask = defaults.blendPixelDataAlphaMask,
  } = deps

  return {
    blendPixelDataAlphaMask(
      src: IPixelData,
      mask: AlphaMask,
      opts: PixelBlendMaskOptions = {},
    ) {
      const x = opts.x ?? 0
      const y = opts.y ?? 0
      const w = opts.w ?? src.width
      const h = opts.h ?? src.height

      writer.accumulator.storeRegionBeforeState(x, y, w, h)

      blendPixelDataAlphaMask(writer.config.target, src, mask, opts)
    },
  }
}) satisfies HistoryMutator<any, Deps>

