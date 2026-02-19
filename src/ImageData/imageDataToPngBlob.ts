import { makeReusableCanvas } from '../Canvas/ReusableCanvas'

const get = makeReusableCanvas()

export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const { canvas, ctx } = get(imageData.width, imageData.height)

  ctx.putImageData(imageData, 0, 0)

  return new Promise((resolve, reject) => {
    canvas!.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to generate PNG blob'))
        }
      },
      'image/png',
    )
  })
}

imageDataToPngBlob.reset = get.reset
