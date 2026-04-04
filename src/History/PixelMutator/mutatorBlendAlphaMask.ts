import type { AlphaMask, IPixelData32, PixelBlendMaskOptions } from '../../_types'
import { blendPixelDataAlphaMask } from '../../PixelData/blendPixelDataAlphaMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { blendPixelDataAlphaMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendAlphaMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelDataAlphaMask = defaults.blendPixelDataAlphaMask,
  } = deps

  return {
    blendAlphaMask(
      src: IPixelData32,
      mask: AlphaMask,
      opts?: PixelBlendMaskOptions,
    ): boolean {
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? src.width
      const h = opts?.h ?? src.height

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)

      return didChange(
        blendPixelDataAlphaMask(writer.config.target, src, mask, opts),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

