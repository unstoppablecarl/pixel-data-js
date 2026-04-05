import { CANVAS_CTX_FAILED } from '../../support/error-strings'
import type { PixelCanvas } from './_canvas-types'

/**
 * Ensures the canvas ctx is always set to imageSmoothingEnabled = false.
 * Intended for canvas elements that are already part of the DOM.
 * @see makeReusableCanvas
 * @throws {Error} If the {@link HTMLCanvasElement} context cannot be initialized.
 */
export function makePixelCanvas(
  canvas: HTMLCanvasElement,
): PixelCanvas {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(CANVAS_CTX_FAILED)
  ctx.imageSmoothingEnabled = false

  return {
    canvas,
    ctx,
    resize(w: number, h: number) {
      canvas.width = w
      canvas.height = h
      ctx.imageSmoothingEnabled = false
    },
  }
}
