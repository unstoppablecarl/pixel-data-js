/**
 * Resamples an IndexedImage by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
import { resampleUint32Array } from '../Algorithm/resampleUint32Array'
import { type IndexedImage } from '../index'

/**
 * Resamples an IndexedImage by a specific factor using nearest neighbor
 * Factor > 1 upscales, Factor < 1 downscales.
 */
export function resampleIndexedImage(
  source: IndexedImage,
  factor: number,
): IndexedImage {

  const output = {
    palette: source.palette,
    transparentPalletIndex: source.transparentPalletIndex,
  } as IndexedImage

  return resampleUint32Array(source.data, source.w, source.h, factor, output) as IndexedImage
}
