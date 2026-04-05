import { makePixelData, type PixelData, type PixelData32 } from '../index'
import { resample32 } from '../Internal/resample32'

/**
 * Resamples PixelData by a specific factor using nearest neighbor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resamplePixelData(
  pixelData: PixelData32,
  factor: number,
): PixelData {
  const { data, width, height } = resample32(pixelData.data32, pixelData.w, pixelData.h, factor)

  return makePixelData(new ImageData(
    new Uint8ClampedArray(data.buffer) as ImageDataArray,
    width,
    height,
  ))
}
