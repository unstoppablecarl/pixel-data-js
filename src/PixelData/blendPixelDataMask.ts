import { type PixelBlendMaskOptions, type PixelData32 } from '../_types'
import { type Mask, MaskType } from '../Mask/_mask-types'
import { blendPixelDataAlphaMask } from './blendPixelDataAlphaMask'
import { blendPixelDataBinaryMask } from './blendPixelDataBinaryMask'

export function blendPixelDataMask(
  target: PixelData32,
  src: PixelData32,
  mask: Mask,
  opts?: PixelBlendMaskOptions,
): boolean {
  if (mask.type === MaskType.BINARY) {
    return blendPixelDataBinaryMask(target, src, mask, opts)
  } else {
    return blendPixelDataAlphaMask(target, src, mask, opts)
  }
}
