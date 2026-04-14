import type { ColorPaintBuffer } from '../Paint/ColorPaintBuffer'
import type { PixelData } from './_pixelData-types'
import { writePixelDataBuffer } from './writePixelDataBuffer'

/**
 * @param writePixelDataBufferFn - @hidden
 */
export function writePaintBufferToPixelData(
  target: PixelData,
  paintBuffer: ColorPaintBuffer,
  writePixelDataBufferFn = writePixelDataBuffer,
) {
  const lookup = paintBuffer.lookup

  for (let i = 0; i < lookup.length; i++) {
    const tile = lookup[i]

    if (tile) {
      writePixelDataBufferFn(target, tile.data, tile.x, tile.y, tile.w, tile.h)
    }
  }
}
