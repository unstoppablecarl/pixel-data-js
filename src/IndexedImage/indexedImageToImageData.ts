import type { IndexedImage } from './_indexedImage-types'

/**
 * Converts an IndexedImage back into standard ImageData.
 */
export function indexedImageToImageData(indexedImage: IndexedImage): ImageData {
  const { w, h, data, palette } = indexedImage
  const result = new ImageData(w, h)
  const data32 = new Uint32Array(result.data.buffer)

  for (let i = 0; i < data.length; i++) {
    const paletteIndex = data[i]
    data32[i] = palette[paletteIndex]
  }

  return result
}
