import type { PixelBlendOptions } from '../../_types'
import type { PixelData32 } from '../../PixelData/_pixelData-types'
import { blendPixelData } from '../../PixelData/blendPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

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
      src: PixelData32,
      opts?: PixelBlendOptions,
    ): boolean {
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? src.w
      const h = opts?.h ?? src.h

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)

      return didChange(
        blendPixelData(writer.config.target, src, opts),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

