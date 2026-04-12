import type { CanvasObjectFactory } from '../../Canvas/_canvas-types'
import type { PixelWriter } from '../../History/PixelWriter'
import { DEFAULT_CANVAS_FACTORY } from '../../Internal/_constants'
import { makeBinaryMaskTile } from '../../Tile/MaskTile'
import { TilePool } from '../../Tile/TilePool'
import { BinaryMaskPaintBuffer } from '../BinaryMaskPaintBuffer'
import { makeBinaryMaskPaintBufferCanvasRenderer } from '../Render/BinaryMaskPaintBufferCanvasRenderer'
import { makeBinaryMaskPaintBufferCommitter } from './BinaryMaskPaintBufferCommitter'

export type BinaryMaskPaintBufferManager = Pick<BinaryMaskPaintBuffer, 'paintBinaryMask' | 'paintRect'> & {
  commit: ReturnType<typeof makeBinaryMaskPaintBufferCommitter>
  draw: ReturnType<typeof makeBinaryMaskPaintBufferCanvasRenderer>
  clear: () => void
}

export function makeBinaryMaskPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
  canvasFactory: CanvasObjectFactory<any> = DEFAULT_CANVAS_FACTORY,
): BinaryMaskPaintBufferManager {
  const pool = new TilePool(writer.config.tileSize, makeBinaryMaskTile)
  const buffer = new BinaryMaskPaintBuffer(writer.config, pool)
  const draw = makeBinaryMaskPaintBufferCanvasRenderer(buffer, canvasFactory)

  return {
    clear: buffer.clear.bind(buffer),
    paintRect: buffer.paintRect.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeBinaryMaskPaintBufferCommitter(writer.accumulator, buffer),
    draw,
  }
}
