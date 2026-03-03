import type { IndexedImage } from './IndexedImage'

/**
 * Converts an IndexedImage back into standard ImageData.
 */
export function indexedImageToImageData(indexedImage: IndexedImage): ImageData {
  const { width, height, data, palette } = indexedImage
  const result = new ImageData(width, height)
  const data32 = new Uint32Array(result.data.buffer)

  for (let i = 0; i < data.length; i++) {
    const paletteIndex = data[i]
    const color = palette[paletteIndex]

    data32[i] = color
  }

  return result
}
