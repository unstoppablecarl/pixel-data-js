import { imageElementLoaded } from '../Image/imageElementLoaded'
import { OFFSCREEN_CANVAS_CTX_FAILED } from '../Internal/_errors'

/** Thrown when an image element has zero width or height after loading. */
export class EmptyImageError extends Error {
  constructor() {
    super('Image has no dimensions. Is the src valid?')
    this.name = 'EmptyImageError'
    if (Error.captureStackTrace) Error.captureStackTrace(this, EmptyImageError)
  }
}

/**
 * Extracts pixel data from an {@link HTMLImageElement} as an {@link ImageData}.
 *
 * @param target - Image element to read. Must have a valid src and non-zero dimensions.
 * @throws {@link FailedToLoadImageError} if the image fails to load.
 * @throws {@link EmptyImageError} if the image has zero width or height.
 */
export async function imageElementToImageData(target: HTMLImageElement): Promise<ImageData> {
  const img = await imageElementLoaded(target)
  const { naturalWidth: w, naturalHeight: h } = img

  if (w === 0 || h === 0) {
    throw new EmptyImageError()
  }
  const canvas = new OffscreenCanvas(w, h)
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error(OFFSCREEN_CANVAS_CTX_FAILED)

  ctx.drawImage(img, 0, 0)
  return ctx.getImageData(0, 0, w, h)
}
