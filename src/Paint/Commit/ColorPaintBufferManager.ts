import type { CanvasObjectFactory } from '../../Canvas/_canvas-types'
import type { PixelWriter } from '../../History/PixelWriter'
import { DEFAULT_CANVAS_FACTORY } from '../../Internal/_constants'
import { makePixelTile } from '../../Tile/PixelTile'
import { TilePool } from '../../Tile/TilePool'
import { ColorPaintBuffer } from '../ColorPaintBuffer'
import { makeColorPaintBufferCanvasRenderer } from '../Render/ColorPaintBufferCanvasRenderer'
import { makeColorPaintBufferCommitter } from './ColorPaintBufferCommitter'

export type ColorPaintBufferManager =
  Pick<ColorPaintBuffer, 'paintAlphaMask' | 'paintBinaryMask' | 'paintRect'>
  & {
  commit: ReturnType<typeof makeColorPaintBufferCommitter>
  draw: ReturnType<typeof makeColorPaintBufferCanvasRenderer>
  clear: () => void
}

export function makeColorPaintBufferManager(
  writer: Pick<PixelWriter<any>, 'accumulator' | 'config'>,
  canvasFactory: CanvasObjectFactory<any> = DEFAULT_CANVAS_FACTORY,
): ColorPaintBufferManager {
  const pool = new TilePool(writer.config, makePixelTile)
  const buffer = new ColorPaintBuffer(writer.config, pool)
  const draw = makeColorPaintBufferCanvasRenderer(buffer, canvasFactory)

  return {
    clear: buffer.clear.bind(buffer),
    paintRect: buffer.paintRect.bind(buffer),
    paintAlphaMask: buffer.paintAlphaMask.bind(buffer),
    paintBinaryMask: buffer.paintBinaryMask.bind(buffer),
    commit: makeColorPaintBufferCommitter(writer.accumulator, buffer),
    draw,
  }
}
