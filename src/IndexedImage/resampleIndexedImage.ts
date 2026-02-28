import type { IndexedImage } from '../index'

/**
 * Resamples an IndexedImage by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resampleIndexedImage(
  source: IndexedImage,
  factor: number,
): IndexedImage {
  const srcW = source.width
  const srcH = source.height
  const dstW = srcW * factor
  const dstH = srcH * factor
  const srcData = source.data
  const dstData = new Int32Array(dstW * dstH)

  for (let y = 0; y < dstH; y++) {
    const srcY = (y / factor) | 0
    const rowOffset = srcY * srcW
    const dstOffset = y * dstW

    for (let x = 0; x < dstW; x++) {
      const srcX = (x / factor) | 0
      dstData[dstOffset + x] = srcData[rowOffset + srcX]!
    }
  }

  return {
    width: dstW,
    height: dstH,
    data: dstData,
    palette: source.palette,
    transparentPalletIndex: source.transparentPalletIndex,
  }
}
