import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { Color32 } from '../../Color/_color-types'
import type { PixelAccumulator } from '../../History/PixelAccumulator'
import { blendColorPixelDataBinaryMask } from '../../PixelData/blendColorPixelDataBinaryMask'
import type { BinaryMaskPaintBuffer } from '../BinaryMaskPaintBuffer'
import { commitMaskPaintBuffer } from './commitMaskPaintBuffer'

export function makeBinaryMaskPaintBufferCommitter(
  accumulator: PixelAccumulator,
  paintBuffer: BinaryMaskPaintBuffer,
) {
  return function commitBinaryMaskPaintBufferToAccumulator(
    color: Color32,
    alpha = 255,
    blendFn = sourceOverPerfect,
  ) {
    return commitMaskPaintBuffer(
      accumulator,
      paintBuffer,
      color,
      alpha,
      blendFn,
      blendColorPixelDataBinaryMask,
    )
  }
}
