import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import type { Color32 } from '../Color/_color-types'
import { MaskType } from '../Mask/_mask-types'
import type { PaintMask, PaintRect } from '../Paint/_paint-types'
import type { PixelData32 } from './_pixelData-types'
import { blendColorPixelData } from './blendColorPixelData'
import { blendColorPixelDataAlphaMask } from './blendColorPixelDataAlphaMask'
import { blendColorPixelDataBinaryMask } from './blendColorPixelDataBinaryMask'

const SCRATCH_OPTS = {
  x: 0,
  y: 0,
  alpha: 255,
  blendFn: sourceOverPerfect,
  w: undefined as number | undefined,
  h: undefined as number | undefined,
}

export function blendColorPixelDataPaintMask(
  target: PixelData32,
  color: Color32,
  mask: PaintMask | PaintRect,
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
  SCRATCH_OPTS.w = undefined
  SCRATCH_OPTS.h = undefined

  if (mask.data) {
    if (mask.type === MaskType.BINARY) {
      return blendColorPixelDataBinaryMask(target, color, mask, SCRATCH_OPTS)
    } else {
      return blendColorPixelDataAlphaMask(target, color, mask, SCRATCH_OPTS)
    }
  }
  SCRATCH_OPTS.w = mask.w
  SCRATCH_OPTS.h = mask.h

  return blendColorPixelData(target, color, SCRATCH_OPTS)
}
