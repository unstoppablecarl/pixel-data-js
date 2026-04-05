import { type Color32, type PaintAlphaMask, type PixelData32 } from '../_types'
import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { blendColorPixelDataAlphaMask } from './blendColorPixelDataAlphaMask'

const SCRATCH_OPTS = {
  x: 0,
  y: 0,
  alpha: 255,
  blendFn: sourceOverPerfect,
}

export function blendColorPixelDataPaintAlphaMask(
  dst: PixelData32,
  color: Color32,
  mask: PaintAlphaMask,
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

  return blendColorPixelDataAlphaMask(dst, color, mask, SCRATCH_OPTS)
}
