import type { BinaryMask, PixelBlendMaskOptions, PixelData32 } from '../../_types'
import { blendPixelDataBinaryMask } from '../../PixelData/blendPixelDataBinaryMask'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { blendPixelDataBinaryMask }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendBinaryMask = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixelDataBinaryMask = defaults.blendPixelDataBinaryMask,
  } = deps

  return {
    blendBinaryMask(
      src: PixelData32,
      mask: BinaryMask,
      opts?: PixelBlendMaskOptions,
    ): boolean {
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? src.width
      const h = opts?.h ?? src.height

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)

      return didChange(
        blendPixelDataBinaryMask(writer.config.target, src, mask, opts),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

