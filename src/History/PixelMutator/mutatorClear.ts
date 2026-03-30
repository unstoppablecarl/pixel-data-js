import type { BinaryMaskRect, Color32, HistoryMutator } from '../../_types'
import { fillPixelData } from '../../PixelData/fillPixelData'
import { PixelWriter } from '../PixelWriter'

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
      rect: Partial<BinaryMaskRect> = {},
    ) {
      const x = rect.x ?? 0
      const y = rect.y ?? 0
      const w = rect.w ?? writer.target.width
      const h = rect.h ?? writer.target.height

      writer.accumulator.storeRegionBeforeState(x, y, w, h)
      fillPixelData(writer.target, 0 as Color32, x, y, w, h)
    },
  }
}) satisfies HistoryMutator<any, Deps>
