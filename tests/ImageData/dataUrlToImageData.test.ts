import { dataUrlToImageData } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { offscreenCanvasMockContext, useOffscreenCanvasMock } from '../_helpers/OffscreenCanvasMock'

const TEST_URL = 'data:image/png;base64,iVBORw0KGgo='

describe('dataUrlToImageData', () => {
  let mockImg: { src: string; naturalWidth: number; naturalHeight: number; complete: boolean }

  beforeEach(() => {
    useOffscreenCanvasMock()
    mockImg = { src: '', naturalWidth: 100, naturalHeight: 50, complete: true }
    vi.stubGlobal('Image', vi.fn().mockReturnValue(mockImg))
  })

  it('sets the src on the created image element', async () => {
    await dataUrlToImageData(TEST_URL)
    expect(mockImg.src).toBe(TEST_URL)
  })

  it('draws the image onto the OffscreenCanvas', async () => {
    await dataUrlToImageData(TEST_URL)
    expect(offscreenCanvasMockContext.drawImage).toHaveBeenCalledWith(mockImg, 0, 0)
  })

  it('returns ImageData with the correct dimensions', async () => {
    const result = await dataUrlToImageData(TEST_URL)
    expect(result.width).toBe(100)
    expect(result.height).toBe(50)
  })

  it('throws when the canvas context is unavailable', async () => {
    vi.stubGlobal('OffscreenCanvas', vi.fn().mockReturnValue({ getContext: () => null }))
    await expect(dataUrlToImageData(TEST_URL)).rejects.toThrow('Failed to create OffscreenCanvas context')
  })
})
