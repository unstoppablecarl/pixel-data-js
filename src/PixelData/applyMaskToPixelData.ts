import {
  type ApplyMaskToPixelDataOptions,

} from '../_types'
import { type AlphaMask, type BinaryMask, type Mask, MaskType } from '../Mask/_mask-types'
import type { PixelData32 } from './_pixelData-types'
import { applyAlphaMaskToPixelData } from './applyAlphaMaskToPixelData'
import { applyBinaryMaskToPixelData } from './applyBinaryMaskToPixelData'

export function applyMaskToPixelData(
  dst: PixelData32,
  mask: Mask,
  opts?: ApplyMaskToPixelDataOptions,
): boolean {
  if (mask.type === MaskType.BINARY) {
    return applyBinaryMaskToPixelData(dst, mask as BinaryMask, opts)
  } else {
    return applyAlphaMaskToPixelData(dst, mask as AlphaMask, opts)
  }
}
