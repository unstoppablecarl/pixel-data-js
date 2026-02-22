import { fileToImageData } from '../../src'

/**
 * A convenience wrapper that extracts the first {@link File} from an
 * {@link HTMLInputElement} change event and converts it into {@link ImageData}.
 *
 * This function handles the boilerplate of accessing the file list and checking
 * for existence. It is ideal for use directly in an `onchange` event listener.
 *
 * @param event - The change {@link Event} from an `<input type="file">` element.
 *
 * @returns A promise that resolves to {@link ImageData} if a file was successfully
 * processed, or `null` if no file was selected or the input was cleared.
 *
 * @example
 * ```typescript
 * const input = document.querySelector('input[type="file"]');
 *
 * input.addEventListener('change', async (event) => {
 *   const imageData = await fileInputChangeToImageData(event);
 *
 *   if (imageData) {
 *     console.log('Image loaded:', imageData.width, imageData.height);
 *   }
 * });
 * ```
 */
export async function fileInputChangeToImageData(
  event: Event,
): Promise<ImageData | null> {
  const target = event.target as HTMLInputElement

  const file = target.files?.[0]
  if (!file) return null

  return await fileToImageData(file)
}
