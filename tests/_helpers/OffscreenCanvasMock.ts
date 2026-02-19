import { vi } from 'vitest'

export const offscreenCanvasMockContext = {
  putImageData: vi.fn(),
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
  drawImage: vi.fn(),
  clearRect: vi.fn(),
}

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
      return offscreenCanvasMockContext
    }

    return null
  }

  async convertToBlob(
    options?: { type?: string },
  ): Promise<Blob> {
    const type = options?.type || 'image/png'
    const blob = new Blob(
      [],
      { type },
    )

    return Promise.resolve(blob)
  }
}

export function useOffscreenCanvasMock() {
  vi.stubGlobal(
    'OffscreenCanvas',
    OffscreenCanvasMock,
  )
}
