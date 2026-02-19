import { makeReusableCanvas } from '../Canvas/ReusableCanvas'

const get = makeReusableCanvas()

export function imageDataToDataUrl(imageData: ImageData): string {
  const { canvas, ctx } = get(imageData.width, imageData.height)

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

imageDataToDataUrl.reset = get.reset
