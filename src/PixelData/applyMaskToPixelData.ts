import {
  type AlphaMask,
  type ApplyMaskToPixelDataOptions,
  type BinaryMask,
  type IPixelData32,
  type Mask,
  MaskType,
} from '../_types'
import { applyAlphaMaskToPixelData } from './applyAlphaMaskToPixelData'
import { applyBinaryMaskToPixelData } from './applyBinaryMaskToPixelData'

export function applyMaskToPixelData(
  dst: IPixelData32,
  mask: Mask,
  opts?: ApplyMaskToPixelDataOptions,
): boolean {
  if (mask.type === MaskType.BINARY) {
    return applyBinaryMaskToPixelData(dst, mask as BinaryMask, opts)
  } else {
    return applyAlphaMaskToPixelData(dst, mask as AlphaMask, opts)
  }
}
