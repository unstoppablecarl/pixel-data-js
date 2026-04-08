import { CANVAS_CTX_FAILED } from '../../Internal/_errors'
import type { ColorPaintBuffer } from '../ColorPaintBuffer'

export type ColorPaintBufferCanvasRenderer = ReturnType<typeof makeColorPaintBufferCanvasRenderer>

/**
 *
 * @param paintBuffer
 * @param offscreenCanvasClass - @internal
 */
export function makeColorPaintBufferCanvasRenderer(
  paintBuffer: ColorPaintBuffer,
  offscreenCanvasClass = OffscreenCanvas,
) {
  const config = paintBuffer.config
  const tileSize = config.tileSize
  const tileShift = config.tileShift
  const lookup = paintBuffer.lookup
  const canvas = new offscreenCanvasClass(tileSize, tileSize)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(CANVAS_CTX_FAILED)
  ctx.imageSmoothingEnabled = false

  return function drawPaintBuffer(
    targetCtx: CanvasRenderingContext2D,
    alpha = 255,
    compOperation: GlobalCompositeOperation = 'source-over',
  ): void {

    targetCtx.globalAlpha = alpha / 255
    targetCtx.globalCompositeOperation = compOperation

    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        const dx = tile.tx << tileShift
        const dy = tile.ty << tileShift

        ctx.putImageData(tile.imageData, 0, 0)

        targetCtx.drawImage(canvas, dx, dy)
      }
    }

    targetCtx.globalAlpha = 1
    targetCtx.globalCompositeOperation = 'source-over'
  }
}
