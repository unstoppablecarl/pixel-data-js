export class OffscreenCanvasMock {
  width: number
  height: number

  constructor(
    width: number,
    height: number,
  ) {
    this.width = width
    this.height = height
  }

  getContext(
    type: string,
  ) {
    if (type === '2d') {
      return {
        // This allows your library to "write" pixels during tests
        putImageData: (
          data: ImageData,
          dx: number,
          dy: number,
        ) => {
        },
        // This allows your library to "read" pixels during tests
        getImageData: (
          sx: number,
          sy: number,
          sw: number,
          sh: number,
        ) => {
          const data = new Uint8ClampedArray(sw * sh * 4)

          return {
            data,
            width: sw,
            height: sh,
          }
        },
        drawImage: () => {
        },
      }
    }

    return null
  }

  async convertToBlob(
    options?: { type?: string; quality?: number },
  ): Promise<Blob> {
    const mimeType = options?.type || 'image/png'
    const blob = new Blob(
      [],
      { type: mimeType },
    )

    return Promise.resolve(blob)
  }
}
