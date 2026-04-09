import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { PixelAccumulator } from '../../History/PixelAccumulator'
import { blendPixelData } from '../../PixelData/blendPixelData'
import type { ColorPaintBuffer } from '../ColorPaintBuffer'
import { commitColorPaintBuffer } from './commitColorPaintBuffer'

export function makeColorPaintBufferCommitter(
  accumulator: PixelAccumulator,
  paintBuffer: ColorPaintBuffer,
) {
  return function commitColorPaintBufferToAccumulator(
    alpha = 255,
    blendFn = sourceOverPerfect,
  ) {
    return commitColorPaintBuffer(
      accumulator,
      paintBuffer,
      alpha,
      blendFn,
      blendPixelData,
    )
  }
}
