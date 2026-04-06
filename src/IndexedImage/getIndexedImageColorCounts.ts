import type { IndexedImage } from '../_types'

/**
 * Calculates the frequency of each palette index based on the image data.
 * The index of the returned array maps directly to the index of the palette.
 * @param indexedImage - The source image containing data and palette definitions.
 * @returns A typed array where each entry represents the total count of that palette index.
 */
export function getIndexedImageColorCounts(indexedImage: IndexedImage): Uint32Array {
  const data = indexedImage.data
  const palette = indexedImage.palette
  const frequencies = new Uint32Array(palette.length)

  for (let i = 0; i < data.length; i++) {
    const colorIndex = data[i]!
    frequencies[colorIndex]++
  }

  return frequencies
}
