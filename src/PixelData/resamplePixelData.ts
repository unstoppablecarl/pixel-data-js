import { resampleUint32Array } from '../Algorithm/resampleUint32Array'
import { type MutablePixelData32, type PixelData, type PixelData32, uInt32ArrayToImageData } from '../index'

/**
 * Resamples PixelData by a specific factor using nearest neighbor.
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resamplePixelData(
  pixelData: PixelData32,
  factor: number,
): PixelData {

  const output = {} as MutablePixelData32

  const resampled = resampleUint32Array(pixelData.data, pixelData.w, pixelData.h, factor, output) as PixelData

  (resampled as any).imageData = uInt32ArrayToImageData(resampled.data, resampled.w, resampled.h)

  return resampled
}

export function resamplePixelDataInPlace(
  pixelData: PixelData32,
  factor: number,
): void {

  const resampled = resampleUint32Array(pixelData.data, pixelData.w, pixelData.h, factor, pixelData) as PixelData

  (resampled as any).imageData = uInt32ArrayToImageData(resampled.data, resampled.w, resampled.h)
}
