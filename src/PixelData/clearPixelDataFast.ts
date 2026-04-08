import type { Color32 } from '../_types'
import type { BinaryMaskRect } from '../Mask/_mask-types'
import type { PixelData32 } from './_pixelData-types'
import { fillPixelDataFast } from './fillPixelDataFast'

/**
 * Clears a region of the PixelData to transparent (0x00000000).
 * Internally uses the optimized fillPixelDataFast.
 */
export function clearPixelDataFast(
  dst: PixelData32,
  rect?: Partial<BinaryMaskRect>,
): void {
  fillPixelDataFast(dst, 0 as Color32, rect)
}
