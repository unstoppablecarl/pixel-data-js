import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fileToImageData, UnsupportedFormatError } from '../../src'
import { OFFSCREEN_CANVAS_CTX_FAILED } from '../../src/Canvas/_constants'
import {
  OffscreenCanvasMock,
  offscreenCanvasMockContext,
  useOffscreenCanvasMock,
} from '../_helpers/OffscreenCanvasMock'

describe('fileToImageData', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.clearAllMocks()
    useOffscreenCanvasMock()
  })

  it('returns null if no file is provided', async () => {
    const result = await fileToImageData(null)

    expect(result).toBeNull()
  })

  it('throws UnsupportedFormatError if file is not an image', async () => {
    const file = new File(
      ['content'],
      'test.txt',
      { type: 'text/plain' },
    )

    await expect(fileToImageData(file)).rejects.toThrow(UnsupportedFormatError)
  })

  it('successfully converts a File to ImageData', async () => {
    const file = new File(
      [],
      'test.png',
      { type: 'image/png' },
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

  it('throws the constant error and closes bitmap if context fails', async () => {
    const file = new File(
      [],
      'test.png',
      { type: 'image/png' },
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

    await expect(fileToImageData(file)).rejects.toThrow(OFFSCREEN_CANVAS_CTX_FAILED)

    // Ensures cleanup happened despite the throw
    expect(mockBitmap.close).toHaveBeenCalled()

    getContextSpy.mockRestore()
  })
})
