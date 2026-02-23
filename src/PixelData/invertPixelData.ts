import type { PixelData } from './PixelData'

export function invertPixelData(
  pixelData: PixelData,
): PixelData {

  const data32 = pixelData.data32
  const len = data32.length

  for (let i = 0; i < len; i++) {
    // XOR with 0x00FFFFFF flips RGB bits and ignores Alpha (the top 8 bits)
    data32[i] = data32[i] ^ 0x00FFFFFF
  }

  return pixelData
}
