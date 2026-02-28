/**
 * Resamples ImageData by a specific factor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resampleImageData(
  source: ImageData,
  factor: number,
): ImageData {
  const srcW = source.width
  const srcH = source.height
  const dstW = Math.max(1, (srcW * factor) | 0)
  const dstH = Math.max(1, (srcH * factor) | 0)
  const srcData = source.data
  const dstData = new Uint8ClampedArray(dstW * dstH * 4)

  for (let y = 0; y < dstH; y++) {
    const srcY = (y / factor) | 0
    const srcRowOffset = srcY * srcW * 4
    const dstRowOffset = y * dstW * 4

    for (let x = 0; x < dstW; x++) {
      const srcX = (x / factor) | 0
      const srcIdx = srcRowOffset + srcX * 4
      const dstIdx = dstRowOffset + x * 4

      // Copy RGBA channels
      dstData[dstIdx] = srcData[srcIdx]!
      dstData[dstIdx + 1] = srcData[srcIdx + 1]!
      dstData[dstIdx + 2] = srcData[srcIdx + 2]!
      dstData[dstIdx + 3] = srcData[srcIdx + 3]!
    }
  }

  return new ImageData(dstData, dstW, dstH)
}
