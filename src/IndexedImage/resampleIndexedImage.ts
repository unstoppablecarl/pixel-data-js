/**
 * Resamples an IndexedImage by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
import { IndexedImage } from '../index'
import { resample32 } from '../Internal/resample32'

/**
 * Resamples an IndexedImage by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resampleIndexedImage(
  source: IndexedImage,
  factor: number,
): IndexedImage {

  const { data, width, height } = resample32(
    source.data,
    source.width,
    source.height,
    factor,
  )

  return new IndexedImage(
    width,
    height,
    data,
    source.palette,
    source.transparentPalletIndex,
  )
}
