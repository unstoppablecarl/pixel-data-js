import type { Color32, IPixelData, Rect } from '../_types'
import { fillPixelData } from './fillPixelData'

/**
 * Clears a region of the PixelData to transparent (0x00000000).
 * Internally uses the optimized fillPixelData.
 */
export function clearPixelData(
  dst: IPixelData,
  rect?: Partial<Rect>,
): void {
  fillPixelData(dst, 0 as Color32, rect)
}
