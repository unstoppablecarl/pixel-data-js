/**
 * Resamples ImageData by a specific factor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
import { resampleUint32Array } from '../Algorithm/resampleUint32Array'

/**
 * Resamples ImageData by a specific factor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resampleImageData(source: ImageData, factor: number): ImageData {
  const src32 = new Uint32Array(source.data.buffer)
  const { data, w, h } = resampleUint32Array(src32, source.width, source.height, factor)

  const uint8ClampedArray = new Uint8ClampedArray(data.buffer) as Uint8ClampedArray<ArrayBuffer>
  return new ImageData(uint8ClampedArray, w, h)
}
