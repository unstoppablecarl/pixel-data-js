import { CANVAS_CTX_FAILED } from './_constants'

export type CanvasContext<T> = T extends HTMLCanvasElement
  ? CanvasRenderingContext2D
  : OffscreenCanvasRenderingContext2D

export type ReusableCanvas<T extends HTMLCanvasElement | OffscreenCanvas> = {
  readonly canvas: T
  readonly ctx: CanvasContext<T>
}

/**
 * Creates a reusable HTMLCanvasElement and context that are not part of the DOM.
 * Ensures it is always set to `context.imageSmoothingEnabled = false`
 * @see makePixelCanvas
 * @throws {Error} If the {@link HTMLCanvasElement} context cannot be initialized.
 */
export function makeReusableCanvas() {
  return makeReusableCanvasMeta<HTMLCanvasElement>((w, h) => {
    const canvas = document.createElement('canvas')

    canvas.width = w
    canvas.height = h

    return canvas
  })
}

/**
 * Creates a reusable OffscreenCanvas and context.
 * Ensures it is always set to `context.imageSmoothingEnabled = false`
 * @see makePixelCanvas
 * @throws {Error} If the {@link OffscreenCanvasRenderingContext2D} context cannot be initialized.
 */
export function makeReusableOffscreenCanvas() {
  return makeReusableCanvasMeta<OffscreenCanvas>((w, h) => new OffscreenCanvas(w, h))
}

function makeReusableCanvasMeta<T extends HTMLCanvasElement | OffscreenCanvas>(
  factory: (w: number, h: number) => T,
) {
  let canvas: T | null = null
  let ctx: CanvasContext<T> | null = null

  const result: ReusableCanvas<T> = {
    canvas: null as any,
    ctx: null as any,
  }

  function get(width: number, height: number): ReusableCanvas<T> {
    if (canvas === null) {
      canvas = factory(width, height)
      ctx = canvas.getContext('2d') as CanvasContext<T> | null

      if (!ctx) {
        throw new Error(CANVAS_CTX_FAILED)
      }

      // Initialize the fresh context state
      ctx.imageSmoothingEnabled = false

      ;(result as any).canvas = canvas
      ;(result as any).ctx = ctx

      // Early return to skip resize/clear checks for brand new canvases
      return result
    }

    // Resize if needed (resizing auto-clears)
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width
      canvas.height = height
      ctx!.imageSmoothingEnabled = false
    } else {
      // Always reset transform before clearing to ensure the whole buffer is wiped
      ctx!.setTransform(1, 0, 0, 1, 0, 0)
      // Same size → manually clear
      ctx!.clearRect(0, 0, width, height)
    }

    return result
  }

  get.reset = () => {
    canvas = null
    ctx = null

    ;(result as any).canvas = null
    ;(result as any).ctx = null
  }

  return get
}
