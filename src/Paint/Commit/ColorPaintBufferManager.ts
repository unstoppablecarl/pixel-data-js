import type { ReusableCanvasFactory } from '../../Canvas/_canvas-types'
import type { PixelWriter } from '../../History/PixelWriter'
import { makePixelTile } from '../../Tile/PixelTile'
import { TilePool } from '../../Tile/TilePool'
import { ColorPaintBuffer } from '../ColorPaintBuffer'
import { makeColorPaintBufferCanvasRenderer } from '../Render/ColorPaintBufferCanvasRenderer'
import { makeColorPaintBufferCommitter } from './ColorPaintBufferCommitter'

export type ColorPaintBufferManager =
  Pick<ColorPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeColorPaintBufferCommitter>
  renderer: ReturnType<typeof makeColorPaintBufferCanvasRenderer>
  clear: () => void
}

export function makeColorPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
  reusableCanvasFactory?: () => ReusableCanvasFactory<any>,
): ColorPaintBufferManager {
  const pool = new TilePool(writer.config.tileSize, makePixelTile)
  const buffer = new ColorPaintBuffer(writer.config, pool)
  const renderer = makeColorPaintBufferCanvasRenderer(buffer, reusableCanvasFactory)

  return {
    clear: buffer.clear.bind(buffer),
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeColorPaintBufferCommitter(writer.accumulator, buffer),
    renderer,
  }
}
