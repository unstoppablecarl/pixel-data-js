import type { Color32, Rect } from '../../_types'
import { fillPixelData } from '../../PixelData/fillPixelData'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { fillPixelData }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorFill = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelData = defaults.fillPixelData,
  } = deps

  return {
    fill(
      color: Color32,
      x = 0,
      y = 0,
      w = writer.config.target.w,
      h = writer.config.target.h,
    ) {
      const target = writer.config.target

      const didChange = writer.accumulator.storeRegionBeforeState(x, y, w, h)
      return didChange(
        fillPixelData(target, color, x, y, w, h),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

/**
 * @param deps - @hidden
 */
export const mutatorFillRect = ((writer: PixelWriter<any>, deps: Deps = defaults) => {
  const {
    fillPixelData = defaults.fillPixelData,
  } = deps

  return {
    fillRect(
      color: Color32,
      rect: Rect,
    ) {
      const target = writer.config.target

      const didChange = writer.accumulator.storeRegionBeforeState(rect.x, rect.y, rect.w, rect.h)
      return didChange(
        fillPixelData(target, color, rect.x, rect.y, rect.w, rect.h),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

