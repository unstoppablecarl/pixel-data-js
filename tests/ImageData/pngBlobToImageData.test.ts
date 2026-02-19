import { beforeEach, describe, expect, it, vi } from 'vitest'
import { pngBlobToImageData } from '../../src/ImageData/pngBlobToImageData'

describe('pngBlobToImageData', () => {
  const mockBitmap = {
    width: 200,
    height: 100,
    close: vi.fn(),
  }

  const mockContext = {
    drawImage: vi.fn(),
    getImageData: vi.fn(),
  }

  const mockImageData = {
    width: 200,
    height: 100,
    data: new Uint8ClampedArray(200 * 100 * 4),
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock global browser APIs
    global.createImageBitmap = vi.fn().mockResolvedValue(mockBitmap)

    global.OffscreenCanvas = vi.fn().mockImplementation(() => {
      return {
        getContext: () => {
          return mockContext
        },
      }
    }) as any

    mockContext.getImageData.mockReturnValue(mockImageData)
  })

  it('should decode a blob into ImageData correctly', async () => {
    const blob = new Blob(['mock-data'], {
      type: 'image/png',
    })

    const result = await pngBlobToImageData(blob)

    expect(global.createImageBitmap).toHaveBeenCalledWith(blob)

    expect(mockContext.drawImage).toHaveBeenCalledWith(mockBitmap, 0, 0)

    expect(result).toBe(mockImageData)
  })

  it('should close the bitmap even if an error occurs', async () => {
    mockContext.getImageData.mockImplementation(() => {
      throw new Error('Canvas Error')
    })

    const blob = new Blob()

    await expect(pngBlobToImageData(blob)).rejects.toThrow('Canvas Error')

    expect(mockBitmap.close).toHaveBeenCalled()
  })

  it('should throw if 2d context is not available', async () => {
    // Override the mock for this specific test
    global.OffscreenCanvas = vi.fn().mockImplementation(() => {
      return {
        getContext: () => {
          return null
        },
      }
    }) as any

    const blob = new Blob()

    await expect(pngBlobToImageData(blob)).rejects.toThrow('Failed to get 2D context')
  })
})
