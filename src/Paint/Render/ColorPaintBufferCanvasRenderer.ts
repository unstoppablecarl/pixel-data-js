import type { CanvasObjectFactory } from '../../Canvas/_canvas-types'
import { DEFAULT_CANVAS_FACTORY } from '../../Internal/_constants'
import { CANVAS_CTX_FAILED } from '../../Internal/_errors'
import type { ColorPaintBuffer } from '../ColorPaintBuffer'

export type ColorPaintBufferCanvasRenderer = ReturnType<typeof makeColorPaintBufferCanvasRenderer>

export function makeColorPaintBufferCanvasRenderer(
  paintBuffer: ColorPaintBuffer,
  canvasFactory: CanvasObjectFactory<any> = DEFAULT_CANVAS_FACTORY,
) {
  const tileSize = paintBuffer.config.tileSize
  const lookup = paintBuffer.lookup

  const canvas = canvasFactory(tileSize, tileSize)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(CANVAS_CTX_FAILED)
  ctx.imageSmoothingEnabled = false

  return function drawPaintBuffer(
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    alpha = 255,
    compOperation: GlobalCompositeOperation = 'source-over',
  ): void {

    targetCtx.globalAlpha = alpha / 255
    targetCtx.globalCompositeOperation = compOperation

    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        ctx.putImageData(tile.imageData, 0, 0)

        targetCtx.drawImage(canvas, tile.x, tile.y)
      }
    }

    targetCtx.globalAlpha = 1
    targetCtx.globalCompositeOperation = 'source-over'
  }
}
