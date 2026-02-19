/**
 * Converts an {@link ImageData} object into a {@link Blob} in PNG format.
 *
 * This operation is asynchronous and utilizes {@link OffscreenCanvas}
 * to perform the encoding, making it suitable for usage in both the main
 * thread and Web Workers.
 *
 * @param imageData - The pixel data to be encoded.
 *
 * @returns A promise that resolves to a {@link Blob} with the MIME type `image/png`.
 *
 * @throws {Error}
 * Thrown if the {@link OffscreenCanvas} context cannot be initialized or the blob
 * encoding fails.
 *
 * @example
 * ```typescript
 * const blob = await imageDataToPngBlob(imageData);
 * const url = URL.createObjectURL(blob);
 * ```
 */
export async function imageDataToPngBlob(imageData: ImageData): Promise<Blob> {
  const canvas = new OffscreenCanvas(imageData.width, imageData.height)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('could not create 2d context')

  ctx.putImageData(imageData, 0, 0)
  return canvas!.convertToBlob({
    type: 'image/png',
  })
}
