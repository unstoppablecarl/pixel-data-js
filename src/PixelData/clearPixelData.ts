import type { Color32, PixelOptions } from '../_types'
import type { PixelData } from '../PixelData'
import { fillPixelData } from './fillPixelData'

/**
 * Clears a region of the PixelData to transparent (0x00000000).
 * Internally uses the optimized fillPixelData.
 */
export function clearPixelData(
  dst: PixelData,
  opts: PixelOptions = {},
): void {
  fillPixelData(dst, 0 as Color32, opts)
}
