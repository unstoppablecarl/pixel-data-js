/**
 * Decodes a {@link Blob} (typically PNG) back into an {@link ImageData} object.
 *
 * This function uses hardware-accelerated decoding via {@link createImageBitmap}
 * and processes the data using an {@link OffscreenCanvas} to ensure
 * compatibility with Web Workers.
 *
 * @param blob - The binary image data to decode.
 *
 * @returns A promise resolving to the decoded {@link ImageData}.
 *
 * @throws {Error}
 * Thrown if the blob is corrupted or the browser cannot decode the format.
 *
 * @example
 * ```typescript
 * const blob = await getBlobFromStorage();
 *
 * const imageData = await pngBlobToImageData(blob);
 * ```
 */
export async function imgBlobToImageData(
  blob: Blob,
): Promise<ImageData> {
  let bitmap: ImageBitmap | null = null

  try {
    bitmap = await createImageBitmap(blob)

    const canvas = new OffscreenCanvas(
      bitmap.width,
      bitmap.height,
    )

    const ctx = canvas.getContext('2d')

    if (!ctx) {
      throw new Error('Failed to get 2D context')
    }

    ctx.drawImage(bitmap, 0, 0)

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
