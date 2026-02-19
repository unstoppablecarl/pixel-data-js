import type { Color32, Rect } from '../_types'
import type { PixelData } from '../PixelData'
import { fillPixelData } from './fillPixelData'

/**
 * Clears a region of the PixelData to transparent (0x00000000).
 * Internally uses the optimized fillPixelData.
 */
export function clearPixelData(
  dst: PixelData,
  rect?: Partial<Rect>,
): void {
  fillPixelData(dst, 0 as Color32, rect)
}
