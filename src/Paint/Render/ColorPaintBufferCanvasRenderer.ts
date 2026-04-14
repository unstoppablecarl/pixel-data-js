import type { ReusableCanvasFactory } from '../../Canvas/_canvas-types'
import { makeReusableOffscreenCanvas } from '../../Canvas/ReusableCanvas'
import type { ColorPaintBuffer } from '../ColorPaintBuffer'

export type ColorPaintBufferCanvasRenderer = ReturnType<typeof makeColorPaintBufferCanvasRenderer>

export function makeColorPaintBufferCanvasRenderer<T extends HTMLCanvasElement | OffscreenCanvas>(
  paintBuffer: ColorPaintBuffer,
  reusableCanvasFactory?: () => ReusableCanvasFactory<T>,
) {
  const factory = (reusableCanvasFactory ?? makeReusableOffscreenCanvas) as unknown as () => ReusableCanvasFactory<T>
  const getBuffer = factory()

  function draw(
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    alpha = 255,
    compOperation: GlobalCompositeOperation = 'source-over',
  ): void {
    const buff = getBuffer(paintBuffer.config.tileSize, paintBuffer.config.tileSize)
    const lookup = paintBuffer.lookup
    const length = lookup.length
    const ctx = buff.ctx
    const canvas = buff.canvas

    targetCtx.globalAlpha = alpha / 255
    targetCtx.globalCompositeOperation = compOperation

    for (let i = 0; i < length; i++) {
      const tile = lookup[i]

      if (tile) {
        ctx.putImageData(tile.imageData, 0, 0)
        targetCtx.drawImage(canvas, tile.x, tile.y)
      }
    }

    targetCtx.globalAlpha = 1
    targetCtx.globalCompositeOperation = 'source-over'
  }

  return {
    draw,
    setBuffer(value: ColorPaintBuffer) {
      paintBuffer = value
    },
  }
}
