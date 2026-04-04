import type { Color32, ColorBlendOptions } from '../../_types'
import { blendColorPixelData } from '../../PixelData/blendColorPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

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
      opts?: ColorBlendOptions,
    ): boolean {
      const target = writer.config.target
      const x = opts?.x ?? 0
      const y = opts?.y ?? 0
      const w = opts?.w ?? target.width
      const h = opts?.h ?? target.height

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      return didChange(
        blendColorPixelData(target, color, opts),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
