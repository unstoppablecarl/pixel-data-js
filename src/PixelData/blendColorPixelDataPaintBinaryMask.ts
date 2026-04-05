import { type Color32, type PaintBinaryMask, type PixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { blendColorPixelDataBinaryMask } from './blendColorPixelDataBinaryMask'

const SCRATCH_OPTS = {
  x: 0,
  y: 0,
  alpha: 255,
  blendFn: sourceOverPerfect,
}

export function blendColorPixelDataPaintBinaryMask(
  dst: PixelData32,
  color: Color32,
  mask: PaintBinaryMask,
  x: number,
  y: number,
  alpha = 255,
  blendFn = sourceOverPerfect,
): boolean {
  const tx = x + mask.centerOffsetX
  const ty = y + mask.centerOffsetY

  SCRATCH_OPTS.x = tx
  SCRATCH_OPTS.y = ty
  SCRATCH_OPTS.alpha = alpha
  SCRATCH_OPTS.blendFn = blendFn

  return blendColorPixelDataBinaryMask(dst, color, mask, SCRATCH_OPTS)
}
