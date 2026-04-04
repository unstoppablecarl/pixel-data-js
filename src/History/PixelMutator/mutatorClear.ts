import type { Color32, Rect } from '../../_types'
import { fillPixelData } from '../../PixelData/fillPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { fillPixelData }

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorClear = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelData = defaults.fillPixelData,
  } = deps

  return {
    clear(
      rect?: Partial<Rect>,
    ) {
      const target = writer.config.target
      const x = rect?.x ?? 0
      const y = rect?.y ?? 0
      const w = rect?.w ?? target.width
      const h = rect?.h ?? target.height

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      return didChange(
        fillPixelData(target, 0 as Color32, x, y, w, h),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>
