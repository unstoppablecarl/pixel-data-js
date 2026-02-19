import { imgBlobToImageData } from '../ImageData/imgBlobToImageData'

/**
 * Extracts {@link ImageData} from a clipboard event if an image is present.
 *
 * This function iterates through the {@link DataTransferItemList} to find
 * the first item with an image MIME type and decodes it.
 *
 * @param clipboardEvent - The event object from a `paste` listener.
 *
 * @returns A promise resolving to {@link ImageData}, or `null` if no
 * image was found in the clipboard.
 *
 * @example
 * ```typescript
 * window.addEventListener('paste', async (event) => {
 *   const data = await getImageDataFromClipboard(event)
 *   if (data) {
 *     console.log('Pasted image dimensions:', data.width, data.height)
 *   }
 * });
 * ```
 */
export async function getImageDataFromClipboard(clipboardEvent: ClipboardEvent) {
  const items = clipboardEvent?.clipboardData?.items
  if (!items?.length) return null

  for (let i = 0; i < items.length; i++) {
    const item = items[i]

    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()

      if (!blob) {
        continue
      }

      return imgBlobToImageData(blob)
    }
  }
  return null
}
