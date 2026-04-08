import { PixelAccumulator } from '../../History/PixelAccumulator'
import { PixelEngineConfig } from '../../History/PixelEngineConfig'
import { makePixelTile } from '../../Tile/PixelTile'
import { TilePool } from '../../Tile/TilePool'
import { ColorPaintBuffer } from '../ColorPaintBuffer'
import { makeColorPaintBufferCommitter } from './ColorPaintBufferCommitter'

export type ColorPaintBufferManager =
  Pick<ColorPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeColorPaintBufferCommitter>
}

export function makeColorPaintBufferManager(writer: {
  readonly accumulator: PixelAccumulator
  readonly config: PixelEngineConfig
}): ColorPaintBufferManager {
  const pool = new TilePool(writer.config, makePixelTile)
  const buffer = new ColorPaintBuffer(writer.config, pool)

  return {
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeColorPaintBufferCommitter(writer.accumulator, buffer),
  }
}
