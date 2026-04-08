import type { DrawPixelLayer, DrawScreenLayer, PixelCanvas, ReusableCanvasFactory } from './_canvas-types'
import { makeReusableOffscreenCanvas } from './ReusableCanvas'

export type CanvasFrameRenderer<T extends HTMLCanvasElement | OffscreenCanvas = OffscreenCanvas> =
  ReturnType<typeof makeCanvasFrameRenderer<T>>

export function makeCanvasFrameRenderer<T extends HTMLCanvasElement | OffscreenCanvas = OffscreenCanvas>(
  reusableCanvasFactory: () => ReusableCanvasFactory<T> = makeReusableOffscreenCanvas as unknown as () => ReusableCanvasFactory<T>,
) {
  const getBuffer = reusableCanvasFactory()

  return function renderCanvasFrame(
    pixelCanvas: PixelCanvas,
    scale: number,
    getImageData: () => ImageData | undefined | null,
    drawPixelLayer?: DrawPixelLayer<T>,
    drawScreenLayer?: DrawScreenLayer,
  ) {

    const canvas = pixelCanvas.canvas
    const ctx = pixelCanvas.ctx
    const w = canvas.width
    const h = canvas.height

    // 1. Clear pixel buffer
    const buffer = getBuffer(w, h)

    // 2. Draw pixel data into pixel buffer
    const img = getImageData()
    if (img) {
      buffer.ctx.putImageData(img, 0, 0)
    }

    // draw transient pixel data
    drawPixelLayer?.(buffer.ctx)

    // clear target canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, w, h)

    // Draw pixel buffer scaled onto screen
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.drawImage(buffer.canvas, 0, 0)

    // Draw overlays in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    drawScreenLayer?.(ctx, scale)
  }
}
