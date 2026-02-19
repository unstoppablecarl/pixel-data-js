export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('could not create 2d context')

  ctx.putImageData(imageData, 0, 0)
  return canvas!.convertToBlob()
}
