export type PixelCanvas = {
  readonly canvas: HTMLCanvasElement,
  readonly ctx: CanvasRenderingContext2D,
  readonly resize: (w: number, h: number) => void
}

/**
 * Ensures the canvas ctx is always set to imageSmoothingEnabled = false.
 * Intended for canvas elements that are already part of the DOM.
 * @see makeReusableCanvas
 * */
export function makePixelCanvas(
  canvas: HTMLCanvasElement,
): PixelCanvas {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('could not create 2d context')
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
