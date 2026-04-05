import type { PixelData } from '../_types'
import type { PaintBuffer } from '../Paint/PaintBuffer'
import { writePixelDataBuffer } from './writePixelDataBuffer'

/**
 * @param writePixelDataBufferFn - @hidden
 */
export function writePaintBufferToPixelData(
  target: PixelData,
  paintBuffer: PaintBuffer,
  writePixelDataBufferFn = writePixelDataBuffer,
) {
  const tileShift = paintBuffer.config.tileShift
  const lookup = paintBuffer.lookup

  for (let i = 0; i < lookup.length; i++) {
    const tile = lookup[i]

    if (tile) {
      const dx = tile.tx << tileShift
      const dy = tile.ty << tileShift

      writePixelDataBufferFn(target, tile.data32, dx, dy, tile.w, tile.h)
    }
  }
}
