import { type IPixelData32, type Mask, MaskType, type PixelBlendMaskOptions } from '../_types'
import { blendPixelDataAlphaMask } from './blendPixelDataAlphaMask'
import { blendPixelDataBinaryMask } from './blendPixelDataBinaryMask'

export function blendPixelDataMask(
  target: IPixelData32,
  src: IPixelData32,
  mask: Mask,
  opts?: PixelBlendMaskOptions,
): boolean {
  if (mask.type === MaskType.BINARY) {
    return blendPixelDataBinaryMask(target, src, mask, opts)
  } else {
    return blendPixelDataAlphaMask(target, src, mask, opts)
  }
}
