import { type AlphaMask, type BinaryMask, MaskType } from '../_mask-types'

export function makeBinaryMaskFromAlphaMask(mask: AlphaMask, threshold: number, out?: BinaryMask): BinaryMask {
  const w = mask.w
  const h = mask.h
  const alphaData = mask.data
  const area = w * h

  const binaryData = new Uint8Array(area)

  for (let i = 0; i < area; i++) {
    if (alphaData[i] >= threshold) {
      binaryData[i] = 1
    }
  }

  return {
    type: MaskType.BINARY,
    w,
    h,
    data: binaryData,
  }
}
