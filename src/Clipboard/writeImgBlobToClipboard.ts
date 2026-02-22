/**
 * Writes a {@link Blob} image to the system clipboard.
 *
 * @param blob - The image {@link Blob} (typically `image/png`) to copy.
 * @returns A promise that resolves when the clipboard has been updated.
 */
export async function writeImgBlobToClipboard(blob: Blob): Promise<void> {
  const item = new ClipboardItem({
    'image/png': blob,
  })

  await navigator.clipboard.write([item])
}
