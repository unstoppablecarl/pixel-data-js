export type CanvasCtx = {
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
}

export function makeReusableCanvas() {
  let canvas: HTMLCanvasElement | null = null
  let ctx: CanvasRenderingContext2D | null = null

  function get(width: number, height: number): CanvasCtx {
    if (canvas === null) {
      canvas = document.createElement('canvas')!
      ctx = canvas.getContext('2d')!
      if (!ctx) throw new Error('Canvas context unavailable')
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
