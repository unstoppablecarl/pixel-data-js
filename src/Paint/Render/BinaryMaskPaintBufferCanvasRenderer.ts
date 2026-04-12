import type { Color32 } from '../../_types'
import type { CanvasObjectFactory } from '../../Canvas/_canvas-types'
import { DEFAULT_CANVAS_FACTORY } from '../../Internal/_constants'
import { CANVAS_CTX_FAILED } from '../../Internal/_errors'
import { makePixelData } from '../../PixelData/PixelData'
import type { BinaryMaskPaintBuffer } from '../BinaryMaskPaintBuffer'

export type BinaryMaskPaintBufferCanvasRenderer = ReturnType<typeof makeBinaryMaskPaintBufferCanvasRenderer>

export function makeBinaryMaskPaintBufferCanvasRenderer(
  paintBuffer: BinaryMaskPaintBuffer,
  canvasFactory: CanvasObjectFactory<any> = DEFAULT_CANVAS_FACTORY,
) {
  const config = paintBuffer.config
  const tileSize = config.tileSize
  const tileArea = config.tileArea
  const lookup = paintBuffer.lookup

  const canvas = canvasFactory(tileSize, tileSize)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(CANVAS_CTX_FAILED)
  ctx.imageSmoothingEnabled = false

  const bridge = makePixelData(new ImageData(tileSize, tileSize))
  const view32 = bridge.data

  return function drawPaintBuffer(
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    color: Color32,
    alpha = 255,
    compOperation: GlobalCompositeOperation = 'source-over',
  ): void {
    if (alpha === 0) return

    const baseSrcAlpha = (color >>> 24)
    if (baseSrcAlpha === 0) return

    targetCtx.globalAlpha = alpha / 255
    targetCtx.globalCompositeOperation = compOperation

    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        const data8 = tile.data
        view32.fill(0)

        for (let p = 0; p < tileArea; p++) {
          // If mask is solid, the final pixel is just the unmodified color
          if (data8[p] === 1) {
            view32[p] = color
          }
        }

        ctx.putImageData(bridge.imageData, 0, 0)
        targetCtx.drawImage(canvas, tile.x, tile.y)
      }
    }

    targetCtx.globalAlpha = 1
    targetCtx.globalCompositeOperation = 'source-over'
  }
}
