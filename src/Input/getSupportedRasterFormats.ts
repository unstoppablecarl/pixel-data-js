// Cache the Promise to prevent race conditions during initialization
let formatsPromise: Promise<string[]> | null = null

const rasterMimes = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/bmp',
]

export async function getSupportedPixelFormats(): Promise<string[]> {
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
      })
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
