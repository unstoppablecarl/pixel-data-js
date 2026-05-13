import { imageElementLoaded } from '../Image/imageElementLoaded'
import { OFFSCREEN_CANVAS_CTX_FAILED } from '../Internal/_errors'

/**
 * Decodes a data URL into an {@link ImageData}.
 *
 * @param url - A base64-encoded data URL (e.g. `"data:image/png;base64,..."`).
 */
export async function dataUrlToImageData(url: string): Promise<ImageData> {
  const img = new Image()
  img.src = url
  await imageElementLoaded(img)
  const canvas = new OffscreenCanvas(img.naturalWidth, img.naturalHeight)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(OFFSCREEN_CANVAS_CTX_FAILED)
  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
}
