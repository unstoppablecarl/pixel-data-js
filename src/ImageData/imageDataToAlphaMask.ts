import type { AlphaMask } from '../_types'
import { pixelDataToAlphaMask } from '../PixelData/pixelDataToAlphaMask'

/**
 * Extracts the alpha channel from raw ImageData into an AlphaMask.
 * When possible use {@link pixelDataToAlphaMask} instead.
 * Repeat calls to the same data will use less memory.
 */
export function imageDataToAlphaMask(
  imageData: ImageData,
): AlphaMask {
  const {
    width,
    height,
    data,
  } = imageData

  // Create a 32-bit view of the existing buffer
  const data32 = new Uint32Array(
    data.buffer,
    data.byteOffset,
    data.byteLength >> 2,
  )
  const len = data32.length
  const mask = new Uint8Array(width * height) as AlphaMask

  for (let i = 0; i < len; i++) {
    const val = data32[i]

    // Extract Alpha (top 8 bits in Little-Endian/ABGR)
    mask[i] = (val >>> 24) & 0xff
  }

  return mask
}
