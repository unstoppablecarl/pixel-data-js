import { CANVAS_CTX_FAILED } from '../Canvas/_constants'
import type { PaintBuffer } from './PaintBuffer'

export type PaintBufferRenderer = ReturnType<typeof makePaintBufferRenderer>

/**
 *
 * @param paintBuffer
 * @param offscreenCanvasClass - @internal
 */
export function makePaintBufferRenderer(
  paintBuffer: PaintBuffer,
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
    target: CanvasRenderingContext2D,
  ): void {
    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        const dx = tile.tx << tileShift
        const dy = tile.ty << tileShift

        ctx.putImageData(tile.imageData, 0, 0)

        target.drawImage(canvas, dx, dy)
      }
    }
  }
}
