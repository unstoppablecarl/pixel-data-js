import { OFFSCREEN_CANVAS_CTX_FAILED } from '../Canvas/_constants'

/**
 * Thrown when the user provides a file that isn't an image.
 */
export class UnsupportedFormatError extends Error {
  constructor(mimeType: string) {
    super(`File type ${mimeType} is not a supported image format.`)
    this.name = 'UnsupportedFormatError'
  }
}

/**
 * Converts a browser `File` object into `ImageData`.
 * This utility handles the full pipeline of image decoding using hardware-accelerated
 * APIs (`createImageBitmap` and `OffscreenCanvas`). It ensures that underlying
 * resources like `ImageBitmap` are properly closed even if the conversion fails.
 *
 * @param file - The image file to convert. Can be null or undefined.
 * @returns A `Promise` resolving to the pixel data as `ImageData`,
 * or `null` if no file was provided.
 * @throws {@link UnsupportedFormatError}
 * Thrown if the provided file's MIME type does not start with `image/`.
 * @example
 * ```typescript
 * try {
 *   const imageData = await fileToImageData(file);
 *   if (imageData) {
 *     console.log('Pixels:', imageData.data);
 *   }
 * } catch (err) {
 *   if (err instanceof UnsupportedFormatError) {
 *     // Handle bad file type
 *   }
 * }
 * ```
 */
export async function fileToImageData(
  file: File | null | undefined,
): Promise<ImageData | null> {
  if (!file) return null

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
