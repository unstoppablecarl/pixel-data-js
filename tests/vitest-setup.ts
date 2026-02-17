import { beforeEach, vi } from 'vitest'

beforeEach(() => {
  vi.unstubAllGlobals()

  if (typeof ImageData === 'undefined') {
    global.ImageData = class {
      width: number
      height: number
      data: Uint8ClampedArray

      constructor(data: Uint8ClampedArray, width: number, height: number) {
        this.width = width
        this.height = height
        this.data = data
      }
    } as any
  }
})
