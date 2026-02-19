import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileToImageData, getSupportedPixelFormats, imageDataToPngBlob } from '../../src'
import {
  OffscreenCanvasMock,
  offscreenCanvasMockContext,
  useOffscreenCanvasMock,
} from '../_helpers/OffscreenCanvasMock'

describe('Image Utility Tests', () => {
  beforeEach(async () => {
    // Reset module registry to clear module-level 'formatsPromise'
    vi.resetModules()
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    useOffscreenCanvasMock()
  })

  describe('imageDataToPngBlob', () => {
    it('successfully converts ImageData to a Blob', async () => {
      const data = new Uint8ClampedArray([
        255,
        0,
        0,
        255,
      ])

      const imageData = new ImageData(
        data,
        1,
        1,
      )

      const blob = await imageDataToPngBlob(imageData)

      expect(blob).toBeDefined()
      expect(blob.type).toBe('image/png')
    })

    it('throws an error if the 2d context cannot be created', async () => {
      const getContextSpy = vi.spyOn(
        OffscreenCanvasMock.prototype,
        'getContext',
      )

      getContextSpy.mockReturnValue(null)

      const imageData = new ImageData(
        1,
        1,
      )

      await expect(imageDataToPngBlob(imageData)).rejects.toThrow('could not create 2d context')
      getContextSpy.mockRestore()
    })
  })

  describe('getSupportedPixelFormats', () => {
    it('should cache the result and only create one canvas', async () => {
      const canvasSpy = vi.fn().mockImplementation(
        (w, h) => new OffscreenCanvasMock(w, h),
      )

      vi.stubGlobal(
        'OffscreenCanvas',
        canvasSpy,
      )

      // Re-import to ensure we use the stubbed global and fresh cache
      const module = await import('../../src/Input/getSupportedRasterFormats')
      const p1 = module.getSupportedPixelFormats()
      const p2 = module.getSupportedPixelFormats()

      await Promise.all([
        p1,
        p2,
      ])

      expect(canvasSpy).toHaveBeenCalledTimes(1)
    })

    it('should filter out formats that fail internally', async () => {
      const convertSpy = vi.spyOn(
        OffscreenCanvasMock.prototype,
        'convertToBlob',
      )

      convertSpy.mockImplementation(async (options) => {
        if (options?.type === 'image/avif') {
          throw new Error('Unsupported')
        }

        const type = options?.type || 'image/png'
        const blob = new Blob(
          [],
          { type },
        )

        return blob
      })

      const formats = await getSupportedPixelFormats()

      expect(formats).toContain('image/png')
      expect(formats).not.toContain('image/avif')
    })

    it('should reset the promise cache if a constructor error occurs', async () => {
      const canvasSpy = vi.fn()

      vi.stubGlobal(
        'OffscreenCanvas',
        canvasSpy,
      )

      canvasSpy.mockImplementationOnce(() => {
        throw new Error('Hardware failure')
      })

      const module = await import('../../src/Input/getSupportedRasterFormats')
      const getSupportedPixelFormatsLocal = module.getSupportedPixelFormats

      await expect(getSupportedPixelFormatsLocal()).rejects.toThrow('Hardware failure')

      canvasSpy.mockImplementationOnce(
        (w, h) => new OffscreenCanvasMock(w, h),
      )

      const formats = await getSupportedPixelFormatsLocal()

      expect(formats).toBeDefined()
      expect(canvasSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('fileToImageData', () => {
    it('returns null if no file is provided', async () => {
      const result = await fileToImageData(null)

      expect(result).toBeNull()
    })

    it('successfully converts a File to ImageData and closes bitmap', async () => {
      const file = new File(
        [],
        'test.png',
      )

      const mockBitmap = {
        width: 10,
        height: 10,
        close: vi.fn(),
      }

      vi.stubGlobal(
        'createImageBitmap',
        vi.fn().mockResolvedValue(mockBitmap),
      )

      const imageData = await fileToImageData(file)

      expect(imageData).toBeDefined()
      expect(mockBitmap.close).toHaveBeenCalled()
      expect(offscreenCanvasMockContext.drawImage).toHaveBeenCalledWith(
        mockBitmap,
        0,
        0,
      )
    })

    it('cleans up resources even if getContext fails', async () => {
      const file = new File(
        [],
        'test.png',
      )

      const mockBitmap = {
        width: 10,
        height: 10,
        close: vi.fn(),
      }

      vi.stubGlobal(
        'createImageBitmap',
        vi.fn().mockResolvedValue(mockBitmap),
      )

      const getContextSpy = vi.spyOn(
        OffscreenCanvasMock.prototype,
        'getContext',
      )

      getContextSpy.mockReturnValue(null)

      await expect(fileToImageData(file)).rejects.toThrow()
      expect(mockBitmap.close).toHaveBeenCalled()

      getContextSpy.mockRestore()
    })
  })
})
