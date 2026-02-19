// Cache the Promise to prevent race conditions during initialization
let formatsPromise: Promise<string[]> | null = null

const defaultRasterMimes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
]

/**
 * Probes the browser environment to determine which image MIME types are
 * supported for pixel-level operations.
 * This function performs a one-time check by attempting to convert a
 * `OffscreenCanvas` to MIME types. The result is
 * cached to prevent redundant hardware-accelerated operations on
 * subsequent calls.
 * @param rasterMimes List of MIME types to check
 * @default ['image/png',
 *   'image/jpeg',
 *   'image/webp',
 *   'image/avif',
 *   'image/gif',
 *   'image/bmp']
 * @returns A `Promise` resolving to an array of supported MIME
 * types from the `rasterMimes` list.
 * * @example
 * ```typescript
 * const supported = await getSupportedPixelFormats();
 * if (supported.includes('image/avif')) {
 *   console.log('High-efficiency formats available');
 * }
 * ```
 */
export async function getSupportedPixelFormats(rasterMimes = defaultRasterMimes): Promise<string[]> {
  if (formatsPromise) {
    return formatsPromise
  }

  const probeCanvas = async () => {
    const canvas = new OffscreenCanvas(1, 1)

    const results = await Promise.all(
      rasterMimes.map(async (mime) => {
        try {
          const blob = await canvas.convertToBlob({
            type: mime,
          })

          return blob.type === mime ? mime : null
        } catch {
          return null
        }
      }),
    )

    return results.filter((type): type is string => {
      return type !== null
    })
  }

  // By chaining .catch here, the microtask guarantees formatsPromise
  // is assigned the promise BEFORE the catch block runs to reset it.
  formatsPromise = probeCanvas().catch((error) => {
    formatsPromise = null

    throw error
  })

  return formatsPromise
}
