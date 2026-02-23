import type { Color32 } from '../_types'
import { packColor } from '../color'
import type { IndexedImage } from './IndexedImage'

/**
 * Calculates the area-weighted average color of an IndexedImage.
 * This accounts for how often each palette index appears in the pixel data.
 * @param indexedImage - The IndexedImage containing pixel indices and the palette.
 * @param includeTransparent - Whether to include the transparent pixels in the average.
 * @returns The average RGBA color of the image.
 */
export function indexedImageToAverageColor(
  indexedImage: IndexedImage,
  includeTransparent: boolean = false,
): Color32 {
  const { data, palette, transparentPalletIndex } = indexedImage
  const counts = new Uint32Array(palette.length / 4)

  // Tally occurrences of each index
  for (let i = 0; i < data.length; i++) {
    const id = data[i]!
    counts[id]!++
  }

  let rSum = 0
  let gSum = 0
  let bSum = 0
  let aSum = 0
  let totalWeight = 0

  for (let id = 0; id < counts.length; id++) {
    const weight = counts[id]!

    if (weight === 0) {
      continue
    }

    if (!includeTransparent && id === transparentPalletIndex) {
      continue
    }

    const pIdx = id * 4
    const r = palette[pIdx]!
    const g = palette[pIdx + 1]!
    const b = palette[pIdx + 2]!
    const a = palette[pIdx + 3]!

    rSum += r * weight
    gSum += g * weight
    bSum += b * weight
    aSum += a * weight
    totalWeight += weight
  }

  if (totalWeight === 0) {
    return packColor(0, 0, 0, 0)
  }

  const r = (rSum / totalWeight) | 0
  const g = (gSum / totalWeight) | 0
  const b = (bSum / totalWeight) | 0
  const a = (aSum / totalWeight) | 0

  return packColor(r, g, b, a)
}
