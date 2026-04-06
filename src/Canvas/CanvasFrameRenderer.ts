import type { DrawPixelLayer, DrawScreenLayer, PixelCanvas, ReusableCanvasFactory } from './_canvas-types'
import { makeReusableOffscreenCanvas } from './ReusableCanvas'

export type CanvasFrameRenderer<T extends HTMLCanvasElement | OffscreenCanvas = OffscreenCanvas> =
  ReturnType<typeof makeCanvasFrameRenderer<T>>

export function makeCanvasFrameRenderer<T extends HTMLCanvasElement | OffscreenCanvas = OffscreenCanvas>(
  reusableCanvasFactory: () => ReusableCanvasFactory<T> = makeReusableOffscreenCanvas as unknown as () => ReusableCanvasFactory<T>,
) {
  const bufferCanvas = reusableCanvasFactory()

  return function renderCanvasFrame(
    pixelCanvas: PixelCanvas,
    scale: number,
    getImageData: () => ImageData | undefined | null,
    drawPixelLayer?: DrawPixelLayer<T>,
    drawScreenLayer?: DrawScreenLayer,
  ) {
    const { canvas, ctx } = pixelCanvas

    // 1. Clear pixel buffer
    const { ctx: pxCtx, canvas: pxCanvas } = bufferCanvas(canvas.width, canvas.height)

    // 2. Draw pixel data into pixel buffer
    const img = getImageData()
    if (img) {
      pxCtx.putImageData(img, 0, 0)
    }

    // draw transient pixel data
    drawPixelLayer?.(pxCtx)

    // clear target canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw pixel buffer scaled onto screen
    ctx.setTransform(scale, 0, 0, scale, 0, 0)
    ctx.drawImage(pxCanvas, 0, 0)

    // Draw overlays in screen space
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    drawScreenLayer?.(ctx, scale)
  }
}
