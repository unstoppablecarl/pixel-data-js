import type { AlphaMask, PixelData32 } from '../_types'
import { makeAlphaMask } from '../Mask/AlphaMask'

/**
 * Extracts the alpha channel from PixelData into a single-channel mask.
 * Returns a Uint8Array branded as AlphaMask.
 */
export function pixelDataToAlphaMask(
  pixelData: PixelData32,
): AlphaMask {
  const {
    data32,
    width,
    height,
  } = pixelData
  const len = data32.length
  const mask = makeAlphaMask(width, height)
  const maskData = mask.data

  for (let i = 0; i < len; i++) {
    const val = data32[i]

    // Extract the Alpha byte (top 8 bits in ABGR / Little-Endian)
    // Shift right by 24 moves the 4th byte to the 1st position
    maskData[i] = (val >>> 24) & 0xff
  }

  return mask
}
