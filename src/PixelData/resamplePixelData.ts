/**
 * Resamples an PixelData by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
import { PixelData } from '../index'
import { resample32 } from '../Internal/resample32'

/**
 * Resamples PixelData by a specific factor using nearest neighbor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resamplePixelData(
  pixelData: PixelData,
  factor: number,
): PixelData {
  const { data, width, height } = resample32(pixelData.data32, pixelData.width, pixelData.height, factor)

  return new PixelData({
    width,
    height,
    data: new Uint8ClampedArray(data.buffer),
  })
}
