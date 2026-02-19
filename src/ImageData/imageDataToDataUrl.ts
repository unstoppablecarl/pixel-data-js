import { makeReusableCanvas } from '../Canvas/ReusableCanvas'

const get = makeReusableCanvas()

/**
 * Converts an {@link ImageData} object into a base64-encoded Data URL string.
 *
 * @param imageData - The pixel data to be converted.
 *
 * @returns A string representing the image in `image/png` format as a
 * [Data URL](https://developer.mozilla.org/en-US/docs/Web/URI/Reference/Schemes/data).
 * @throws {Error} If the {@link HTMLCanvasElement} context cannot be initialized.
 * @example
 * ```typescript
 * const dataUrl = imageDataToDataUrl(imageData);
 * const img = new Image();
 * img.src = dataUrl;
 * ```
 */
export function imageDataToDataUrl(imageData: ImageData): string {
  const { canvas, ctx } = get(imageData.width, imageData.height)

  ctx.putImageData(imageData, 0, 0)
  return canvas.toDataURL()
}

imageDataToDataUrl.reset = get.reset
