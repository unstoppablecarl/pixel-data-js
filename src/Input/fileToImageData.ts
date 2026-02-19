import { OFFSCREEN_CANVAS_CTX_FAILED } from '../Canvas/_constants'

/**
 * Base error for all library-related failures.
 */
export class FileImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FileImageError'
  }
}

/**
 * Thrown when the user provides a file that isn't an image.
 * Actionable: Tell user to pick a different file.
 */
export class UnsupportedFormatError extends FileImageError {
  constructor(mimeType: string) {
    super(`File type ${mimeType} is not a supported image format.`)
    this.name = 'UnsupportedFormatError'
  }
}

export async function fileToImageData(
  file: File | null | undefined,
): Promise<ImageData | null> {
  if (!file) {
    return null
  }

  if (!file.type.startsWith('image/')) {
    throw new UnsupportedFormatError(file.type)
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
