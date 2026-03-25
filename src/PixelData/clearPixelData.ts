import type { BinaryMaskRect, Color32, IPixelData } from '../_types'
import { fillPixelData } from './fillPixelData'

/**
 * Clears a region of the PixelData to transparent (0x00000000).
 * Internally uses the optimized fillPixelData.
 */
export function clearPixelData(
  dst: IPixelData,
  rect?: Partial<BinaryMaskRect>,
): void {
  fillPixelData(dst, 0 as Color32, rect)
}
