/** Thrown when an {@link HTMLImageElement} fails to load. */
export class FailedToLoadImageError extends Error {
  constructor(src: string) {
    super(`Failed to load image: ${src}`)
    this.name = 'FailedToLoadImageError'
    if (Error.captureStackTrace) Error.captureStackTrace(this, FailedToLoadImageError)
  }
}

/**
 * Resolves with `img` once it has fully loaded, using cached state when available.
 * Rejects with {@link FailedToLoadImageError} if the image fails to load or is already broken.
 */
export async function imageElementLoaded(img: HTMLImageElement): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (img.complete) {
      img.naturalWidth !== 0 ? resolve(img) : reject(new FailedToLoadImageError(img.src))
      return
    }

    const controller = new AbortController()
    const cleanup = () => controller.abort()

    img.addEventListener('load', () => {
      cleanup()
      resolve(img)
    }, { signal: controller.signal })

    img.addEventListener('error', () => {
      cleanup()
      reject(new FailedToLoadImageError(img.src))
    }, { signal: controller.signal })
  })
}
