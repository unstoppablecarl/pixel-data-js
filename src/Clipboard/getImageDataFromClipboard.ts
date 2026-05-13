import { imgBlobToImageData } from '../ImageData/imgBlobToImageData'

/**
 * Reads the system clipboard and returns the first image found as {@link ImageData}.
 *
 * Requires the `clipboard-read` permission. Returns `null` if the clipboard
 * contains no image data.
 *
 * @returns A promise resolving to {@link ImageData}, or `null` if no image
 * was found in the clipboard.
 *
 * @throws {Error} If clipboard access is denied or the image cannot be decoded.
 *
 * @example
 * ```typescript
 * const imageData = await getImageDataFromClipboard()
 * if (imageData) {
 *   console.log('Clipboard image dimensions:', imageData.width, imageData.height)
 * }
 * ```
 */
export async function getImageDataFromClipboard(): Promise<ImageData | null> {
  const items = await navigator.clipboard.read()

  for (const item of items) {
    const imageType = item.types.find(type => type.startsWith('image/'))
    if (!imageType) continue

    const blob = await item.getType(imageType)
    return imgBlobToImageData(blob)
  }

  return null
}
