import { type AlphaMask, type BinaryMask, MaskType, type MutableBinaryMask } from '../_mask-types'

export function makeBinaryMaskFromAlphaMask(mask: AlphaMask, threshold: number, out?: MutableBinaryMask): BinaryMask {
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

  out = out ?? { type: MaskType.BINARY } as MutableBinaryMask
  out.data = binaryData
  out.w = w
  out.h = h

  return out
}
