import type { AlphaMask } from '../Mask/_mask-types'
import { makeAlphaMask } from '../Mask/AlphaMask'
import type { PixelData32 } from './_pixelData-types'

/**
 * Extracts the alpha channel from PixelData into a single-channel mask.
 * Returns a Uint8Array branded as AlphaMask.
 */
export function pixelDataToAlphaMask(
  pixelData: PixelData32,
): AlphaMask {
  const {
    data,
    w,
    h,
  } = pixelData
  const len = data.length
  const mask = makeAlphaMask(w, h)
  const maskData = mask.data

  for (let i = 0; i < len; i++) {
    const val = data[i]

    // Extract the Alpha byte (top 8 bits in ABGR / Little-Endian)
    // Shift right by 24 moves the 4th byte to the 1st position
    maskData[i] = (val >>> 24) & 0xff
  }

  return mask
}
