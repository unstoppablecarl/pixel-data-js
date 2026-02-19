let canvas: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

export async function imageDataToPngBlob(
  imageData: ImageData,
): Promise<Blob> {
  if (!canvas) {
    canvas = document.createElement('canvas')!
    ctx = canvas.getContext('2d')!
  }

  ctx!.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) => {
    canvas!.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Failed to generate PNG blob'))
    }, 'image/png')
  })
}
