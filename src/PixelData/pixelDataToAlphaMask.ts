import type { AlphaMask, IPixelData } from '../_types'

/**
 * Extracts the alpha channel from PixelData into a single-channel mask.
 * Returns a Uint8Array branded as AlphaMask.
 */
export function pixelDataToAlphaMask(
  pixelData: IPixelData,
): AlphaMask {
  const {
    data32,
    width,
    height,
  } = pixelData
  const len = data32.length
  const mask = new Uint8Array(width * height) as AlphaMask

  for (let i = 0; i < len; i++) {
    const val = data32[i]

    // Extract the Alpha byte (top 8 bits in ABGR / Little-Endian)
    // Shift right by 24 moves the 4th byte to the 1st position
    mask[i] = (val >>> 24) & 0xff
  }

  return mask
}
