import { PixelAccumulator } from '../../History/PixelAccumulator'
import { PixelEngineConfig } from '../../History/PixelEngineConfig'
import { makeAlphaMaskTile } from '../../Tile/MaskTile'
import { TilePool } from '../../Tile/TilePool'
import { AlphaMaskPaintBuffer } from '../AlphaMaskPaintBuffer'
import { makeAlphaMaskPaintBufferCommitter } from './AlphaMaskPaintBufferCommitter'

export type AlphaMaskPaintBufferManager =
  Pick<AlphaMaskPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeAlphaMaskPaintBufferCommitter>
}

export function makeAlphaMaskPaintBufferManager(writer: {
  readonly accumulator: PixelAccumulator
  readonly config: PixelEngineConfig
}): AlphaMaskPaintBufferManager {
  const pool = new TilePool(writer.config, makeAlphaMaskTile)
  const buffer = new AlphaMaskPaintBuffer(writer.config, pool)

  return {
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeAlphaMaskPaintBufferCommitter(writer.accumulator, buffer),
  }
}
