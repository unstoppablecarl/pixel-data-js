import { OFFSCREEN_CANVAS_CTX_FAILED } from '../Canvas/_constants'

export async function fileToImageData(
  file: File | null | undefined,
): Promise<ImageData | null> {
  if (!file) {
    return null
  }

  let bitmap: ImageBitmap | null = null

  try {
    bitmap = await createImageBitmap(file)

    const canvas = new OffscreenCanvas(
      bitmap.width,
      bitmap.height,
    )

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error(OFFSCREEN_CANVAS_CTX_FAILED)

    ctx.drawImage(
      bitmap,
      0,
      0,
    )

    return ctx.getImageData(
      0,
      0,
      bitmap.width,
      bitmap.height,
    )
  } finally {
    bitmap?.close()
  }
}
