import type { Color32 } from '../../_types'
import { sourceOverPerfect } from '../../BlendModes/blend-modes-perfect'
import type { PixelAccumulator } from '../../History/PixelAccumulator'
import { blendColorPixelDataAlphaMask } from '../../PixelData/blendColorPixelDataAlphaMask'
import type { AlphaMaskPaintBuffer } from '../AlphaMaskPaintBuffer'
import { commitMaskPaintBuffer } from './commitMaskPaintBuffer'

export function makeAlphaMaskPaintBufferCommitter(
  accumulator: PixelAccumulator,
  paintBuffer: AlphaMaskPaintBuffer,
) {
  return function commitAlphaMaskPaintBufferToAccumulator(
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
      blendColorPixelDataAlphaMask,
    )
  }
}
