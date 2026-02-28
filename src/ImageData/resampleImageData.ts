/**
 * Resamples ImageData by a specific factor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
import { resample32 } from '../Internal/resample32'

/**
 * Resamples ImageData by a specific factor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resampleImageData(source: ImageData, factor: number): ImageData {
  const src32 = new Uint32Array(source.data.buffer)
  const { data, width, height } = resample32(src32, source.width, source.height, factor)

  const uint8ClampedArray = new Uint8ClampedArray(data.buffer) as Uint8ClampedArray<ArrayBuffer>
  return new ImageData(uint8ClampedArray, width, height)
}
