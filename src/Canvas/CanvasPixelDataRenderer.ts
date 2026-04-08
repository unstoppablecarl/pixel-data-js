import type { PixelData } from '../PixelData/_pixelData-types'
import type { ReusableCanvasFactory } from './_canvas-types'
import { makeReusableOffscreenCanvas } from './ReusableCanvas'

export type CanvasPixelDataRenderer = ReturnType<typeof makeCanvasPixelDataRenderer>

export function makeCanvasPixelDataRenderer<T extends HTMLCanvasElement | OffscreenCanvas = OffscreenCanvas>(
  reusableCanvasFactory: () => ReusableCanvasFactory<T> = makeReusableOffscreenCanvas as unknown as () => ReusableCanvasFactory<T>,
) {
  const bufferCanvas = reusableCanvasFactory()

  return function drawPixelData(
    targetCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
    pixelData: PixelData,
    x = 0,
    y = 0,
  ): void {
    const buffer = bufferCanvas(pixelData.w, pixelData.h)

    buffer.ctx.putImageData(pixelData.imageData, 0, 0)
    targetCtx.drawImage(buffer.canvas, x, y)
  }
}
