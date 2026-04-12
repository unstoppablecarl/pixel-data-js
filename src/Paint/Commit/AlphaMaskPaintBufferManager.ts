import type { CanvasObjectFactory } from '../../Canvas/_canvas-types'
import type { PixelWriter } from '../../History/PixelWriter'
import { DEFAULT_CANVAS_FACTORY } from '../../Internal/_constants'
import { makeAlphaMaskTile } from '../../Tile/MaskTile'
import { TilePool } from '../../Tile/TilePool'
import { AlphaMaskPaintBuffer } from '../AlphaMaskPaintBuffer'
import { makeAlphaMaskPaintBufferCanvasRenderer } from '../Render/AlphaMaskPaintBufferCanvasRenderer'
import { makeAlphaMaskPaintBufferCommitter } from './AlphaMaskPaintBufferCommitter'

export type AlphaMaskPaintBufferManager =
  Pick<AlphaMaskPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeAlphaMaskPaintBufferCommitter>
  draw: ReturnType<typeof makeAlphaMaskPaintBufferCanvasRenderer>
  clear: () => void
}

export function makeAlphaMaskPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
  canvasFactory: CanvasObjectFactory<any> = DEFAULT_CANVAS_FACTORY,
): AlphaMaskPaintBufferManager {
  const pool = new TilePool(writer.config.tileSize, makeAlphaMaskTile)
  const buffer = new AlphaMaskPaintBuffer(writer.config, pool)
  const draw = makeAlphaMaskPaintBufferCanvasRenderer(buffer, canvasFactory)

  return {
    clear: buffer.clear.bind(buffer),
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeAlphaMaskPaintBufferCommitter(writer.accumulator, buffer),
    draw,
  }
}
