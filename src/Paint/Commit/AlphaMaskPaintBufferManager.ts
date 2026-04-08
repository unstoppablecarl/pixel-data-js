import type { PixelWriter } from '../../History/PixelWriter'
import { makeAlphaMaskTile } from '../../Tile/MaskTile'
import { TilePool } from '../../Tile/TilePool'
import { AlphaMaskPaintBuffer } from '../AlphaMaskPaintBuffer'
import { makeAlphaMaskPaintBufferCommitter } from './AlphaMaskPaintBufferCommitter'

export type AlphaMaskPaintBufferManager =
  Pick<AlphaMaskPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeAlphaMaskPaintBufferCommitter>
}

export function makeAlphaMaskPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
): AlphaMaskPaintBufferManager {
  const pool = new TilePool(writer.config, makeAlphaMaskTile)
  const buffer = new AlphaMaskPaintBuffer(writer.config, pool)

  return {
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeAlphaMaskPaintBufferCommitter(writer.accumulator, buffer),
  }
}
