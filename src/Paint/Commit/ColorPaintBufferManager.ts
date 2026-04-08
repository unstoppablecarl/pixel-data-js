import type { PixelWriter } from '../../History/PixelWriter'
import { makePixelTile } from '../../Tile/PixelTile'
import { TilePool } from '../../Tile/TilePool'
import { ColorPaintBuffer } from '../ColorPaintBuffer'
import { makeColorPaintBufferCommitter } from './ColorPaintBufferCommitter'

export type ColorPaintBufferManager =
  Pick<ColorPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeColorPaintBufferCommitter>
}

export function makeColorPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
): ColorPaintBufferManager {
  const pool = new TilePool(writer.config, makePixelTile)
  const buffer = new ColorPaintBuffer(writer.config, pool)

  return {
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeColorPaintBufferCommitter(writer.accumulator, buffer),
  }
}
