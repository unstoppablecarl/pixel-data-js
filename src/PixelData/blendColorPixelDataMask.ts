import { type Color32, type ColorBlendMaskOptions, type Mask, MaskType, type PixelData32 } from '../_types'
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
