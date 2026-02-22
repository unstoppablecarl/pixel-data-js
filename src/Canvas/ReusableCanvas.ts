import { CANVAS_CTX_FAILED } from './_constants'

export type ReusableCanvas = {
  readonly canvas: HTMLCanvasElement
  readonly ctx: CanvasRenderingContext2D
}

/**
 * Creates a reusable canvas and context that are not part of the DOM.
 * Ensures it is always set to `context.imageSmoothingEnabled = false`
 * @see makePixelCanvas
 * @throws {Error} If the {@link HTMLCanvasElement} context cannot be initialized.
 */
export function makeReusableCanvas() {
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null

  function get(width: number, height: number): ReusableCanvas {
    if (canvas === null) {
      canvas = document.createElement('canvas')!
      ctx = canvas.getContext('2d')!
      if (!ctx) throw new Error(CANVAS_CTX_FAILED)
    }

    // Resize if needed (resizing auto-clears)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      ctx!.imageSmoothingEnabled = false
    } else {
      // Same size → manually clear
      ctx!.clearRect(0, 0, width, height)
    }

    return { canvas, ctx: ctx! }
  }

  get.reset = () => {
    canvas = null
    ctx = null
  }

  return get
}
