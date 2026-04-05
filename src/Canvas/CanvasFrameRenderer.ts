import type { PixelCanvas } from './PixelCanvas'
import { makeReusableOffscreenCanvas } from './ReusableCanvas'

type CanvasCtx = CanvasRenderingContext2D
type OffCanvasCtx = OffscreenCanvasRenderingContext2D

export type DrawPixelLayer<T extends CanvasCtx | OffCanvasCtx> = (ctx: T) => void
export type DrawScreenLayer = (ctx: CanvasCtx, scale: number) => void
export type CanvasFrameRenderer = ReturnType<typeof makeCanvasFrameRenderer>

export function makeCanvasFrameRenderer(reusableCanvasFactory = makeReusableOffscreenCanvas) {
  const bufferCanvas = reusableCanvasFactory()
  type BufferCtx = ReturnType<typeof bufferCanvas>['ctx']

  return function renderCanvasFrame(
    pixelCanvas: PixelCanvas,
    scale: number,
    getImageData: () => ImageData | undefined | null,
    drawPixelLayer?: DrawPixelLayer<BufferCtx>,
    drawScreenLayer?: DrawScreenLayer,
  ) {
    const { canvas, ctx } = pixelCanvas

    // 1. Clear pixel buffer (unscaled)
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
