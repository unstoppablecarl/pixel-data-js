import type { BinaryMaskRect, Color32, IPixelData } from '../_types'
import { fillPixelDataFast } from './fillPixelDataFast'

/**
 * Clears a region of the PixelData to transparent (0x00000000).
 * Internally uses the optimized fillPixelData.
 */
export function clearPixelData(
  dst: IPixelData,
  rect?: Partial<BinaryMaskRect>,
): void {
  fillPixelDataFast(dst, 0 as Color32, rect)
}
