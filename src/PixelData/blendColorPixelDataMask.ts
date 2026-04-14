import { type ColorBlendMaskOptions } from '../_types'
import type { Color32 } from '../Color/_color-types'
import { type Mask, MaskType } from '../Mask/_mask-types'
import type { PixelData32 } from './_pixelData-types'
import { blendColorPixelDataAlphaMask } from './blendColorPixelDataAlphaMask'
import { blendColorPixelDataBinaryMask } from './blendColorPixelDataBinaryMask'

export function blendColorPixelDataMask(
  dst: PixelData32,
  color: Color32,
  mask: Mask,
  opts?: ColorBlendMaskOptions,
): boolean {
  if (mask.type === MaskType.BINARY) {
    return blendColorPixelDataBinaryMask(dst, color, mask, opts)
  } else {
    return blendColorPixelDataAlphaMask(dst, color, mask, opts)
  }
}
