import { PixelAccumulator } from '../../History/PixelAccumulator'
import { PixelEngineConfig } from '../../History/PixelEngineConfig'
import { makeBinaryMaskTile } from '../../Tile/MaskTile'
import { TilePool } from '../../Tile/TilePool'
import { BinaryMaskPaintBuffer } from '../BinaryMaskPaintBuffer'
import { makeBinaryMaskPaintBufferCommitter } from './BinaryMaskPaintBufferCommitter'

export type BinaryMaskPaintBufferManager = Pick<BinaryMaskPaintBuffer, 'paintBinaryMask' | 'paintRect'> & {
  commit: ReturnType<typeof makeBinaryMaskPaintBufferCommitter>
}

export function makeBinaryMaskPaintBufferManager(writer: {
  readonly accumulator: PixelAccumulator
  readonly config: PixelEngineConfig
}): BinaryMaskPaintBufferManager {
  const pool = new TilePool(writer.config, makeBinaryMaskTile)
  const buffer = new BinaryMaskPaintBuffer(writer.config, pool)

  return {
    paintRect: buffer.paintRect.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeBinaryMaskPaintBufferCommitter(writer.accumulator, buffer),
  }
}
