import { imageDataToImgBlob } from '../ImageData/imageDataToImgBlob'
import { writeImgBlobToClipboard } from './writeImgBlobToClipboard'

/**
 * Converts {@link ImageData} to a PNG {@link Blob} and writes it to the system clipboard.
 * This is a high-level utility that combines {@link imageDataToImgBlob} and
 * {@link writeImgBlobToClipboard}.
 * @param imageData - The image data to copy to the clipboard.
 * @returns A promise that resolves when the image has been successfully copied.
 * @throws {Error}
 * If the conversion to blob fails or clipboard permissions are denied.
 *
 * @example
 * ```typescript
 * const canvas = document.querySelector('canvas')
 * const ctx = canvas.getContext('2d')
 * const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
 * await writeImageDataToClipboard(imageData)
 * ```
 */
export async function writeImageDataToClipboard(imageData: ImageData): Promise<void> {
  const blob = await imageDataToImgBlob(imageData)

  return writeImgBlobToClipboard(blob)
}
