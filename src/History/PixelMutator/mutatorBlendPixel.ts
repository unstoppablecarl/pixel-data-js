import type { BlendColor32 } from '../../_types'
import type { Color32 } from '../../Color/_color-types'
import { blendPixel } from '../../PixelData/blendPixel'
import { type HistoryMutator, PixelWriter } from '../PixelWriter'

const defaults = { blendPixel }
type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export const mutatorBlendPixel = ((writer: PixelWriter<any>, deps: Partial<Deps> = defaults) => {
  const {
    blendPixel = defaults.blendPixel,
  } = deps

  return {
    blendPixel(
      x: number,
      y: number,
      color: Color32,
      alpha?: number,
      blendFn?: BlendColor32,
    ): boolean {

      const didChange = writer.accumulator.storePixelBeforeState(x, y)
      if (!didChange) return false

      return didChange(
        blendPixel(writer.config.target, x, y, color, alpha, blendFn),
      )
    },
  }
}) satisfies HistoryMutator<any, Deps>

