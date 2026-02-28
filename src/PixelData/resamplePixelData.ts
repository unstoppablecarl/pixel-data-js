import { PixelData } from '../index'

/**
 * Resamples an PixelData by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resamplePixelData(pixelData: PixelData, factor: number): PixelData {
  const dstW = Math.max(1, (pixelData.width * factor) | 0)
  const dstH = Math.max(1, (pixelData.height * factor) | 0)
  const dstBuffer = new Uint8ClampedArray(dstW * dstH * 4)
  const dstData32 = new Uint32Array(dstBuffer.buffer)

  for (let y = 0; y < dstH; y++) {
    const srcY = (y / factor) | 0
    const srcRowOffset = srcY * pixelData.width
    const dstRowOffset = y * dstW

    for (let x = 0; x < dstW; x++) {
      const srcX = (x / factor) | 0
      dstData32[dstRowOffset + x] = pixelData.data32[srcRowOffset + srcX]!
    }
  }

  return new PixelData({
    data: dstBuffer,
    width: dstW,
    height: dstH,
  })
}
