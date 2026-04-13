import type { ReusableCanvasFactory } from '../../Canvas/_canvas-types'
import type { PixelWriter } from '../../History/PixelWriter'
import { makeBinaryMaskTile } from '../../Tile/MaskTile'
import { TilePool } from '../../Tile/TilePool'
import { BinaryMaskPaintBuffer } from '../BinaryMaskPaintBuffer'
import { makeBinaryMaskPaintBufferCanvasRenderer } from '../Render/BinaryMaskPaintBufferCanvasRenderer'
import { makeBinaryMaskPaintBufferCommitter } from './BinaryMaskPaintBufferCommitter'

export type BinaryMaskPaintBufferManager = Pick<BinaryMaskPaintBuffer, 'paintBinaryMask' | 'paintRect'> & {
  commit: ReturnType<typeof makeBinaryMaskPaintBufferCommitter>
  renderer: ReturnType<typeof makeBinaryMaskPaintBufferCanvasRenderer>
  clear: () => void
}

export function makeBinaryMaskPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
  reusableCanvasFactory?: () => ReusableCanvasFactory<any>,
): BinaryMaskPaintBufferManager {
  const pool = new TilePool(writer.config.tileSize, makeBinaryMaskTile)
  const buffer = new BinaryMaskPaintBuffer(writer.config, pool)
  const renderer = makeBinaryMaskPaintBufferCanvasRenderer(buffer, reusableCanvasFactory)

  return {
    clear: buffer.clear.bind(buffer),
    paintRect: buffer.paintRect.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeBinaryMaskPaintBufferCommitter(writer.accumulator, buffer),
    renderer,
  }
}
