import type { PixelCanvas } from './PixelCanvas'
import { makeReusableCanvas } from './ReusableCanvas'

export type DrawPixelLayer = (ctx: CanvasRenderingContext2D) => void
export type DrawScreenLayer = (ctx: CanvasRenderingContext2D, scale: number) => void
export type CanvasFrameRenderer = ReturnType<typeof makeCanvasFrameRenderer>

const defaults = {
  makeReusableCanvas,
}

type Deps = Partial<typeof defaults>

/**
 * @param deps - @hidden
 */
export function makeCanvasFrameRenderer(deps: Deps = defaults) {
  const {
    makeReusableCanvas = defaults.makeReusableCanvas,
  } = deps

  const bufferCanvas = makeReusableCanvas()

  return function renderCanvasFrame(
    pixelCanvas: PixelCanvas,
    scale: number,
    getImageData: () => ImageData | undefined | null,
    drawPixelLayer?: DrawPixelLayer,
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
