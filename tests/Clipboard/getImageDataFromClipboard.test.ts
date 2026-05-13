import { getImageDataFromClipboard } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as imageModule from '../../src/ImageData/imgBlobToImageData'

describe('getImageDataFromClipboard', () => {
  const mockRead = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(navigator, {
      clipboard: { read: mockRead },
    })
  })

  it('returns null when the clipboard is empty', async () => {
    mockRead.mockResolvedValue([])
    expect(await getImageDataFromClipboard()).toBeNull()
  })

  it('returns null when no clipboard item contains an image type', async () => {
    mockRead.mockResolvedValue([
      { types: ['text/plain'], getType: vi.fn() },
    ])
    expect(await getImageDataFromClipboard()).toBeNull()
  })

  it('decodes and returns the first image item', async () => {
    const mockBlob = new Blob([], { type: 'image/png' })
    const mockImageData = { width: 100, height: 50 } as ImageData
    const spy = vi.spyOn(imageModule, 'imgBlobToImageData').mockResolvedValue(mockImageData)
    const mockGetType = vi.fn().mockResolvedValue(mockBlob)

    mockRead.mockResolvedValue([
      { types: ['image/png'], getType: mockGetType },
    ])

    const result = await getImageDataFromClipboard()

    expect(mockGetType).toHaveBeenCalledWith('image/png')
    expect(spy).toHaveBeenCalledWith(mockBlob)
    expect(result).toBe(mockImageData)
  })

  it('skips non-image items and finds an image further in the list', async () => {
    const mockBlob = new Blob([], { type: 'image/png' })
    const mockImageData = { width: 10, height: 10 } as ImageData
    const spy = vi.spyOn(imageModule, 'imgBlobToImageData').mockResolvedValue(mockImageData)
    const mockGetType = vi.fn().mockResolvedValue(mockBlob)

    mockRead.mockResolvedValue([
      { types: ['text/plain'], getType: vi.fn() },
      { types: ['image/png'], getType: mockGetType },
    ])

    const result = await getImageDataFromClipboard()

    expect(spy).toHaveBeenCalledTimes(1)
    expect(result).toBe(mockImageData)
  })

  it('handles non-png image types', async () => {
    const mockBlob = new Blob([], { type: 'image/jpeg' })
    const mockImageData = { width: 200, height: 100 } as ImageData
    const spy = vi.spyOn(imageModule, 'imgBlobToImageData').mockResolvedValue(mockImageData)
    const mockGetType = vi.fn().mockResolvedValue(mockBlob)

    mockRead.mockResolvedValue([
      { types: ['image/jpeg'], getType: mockGetType },
    ])

    const result = await getImageDataFromClipboard()

    expect(mockGetType).toHaveBeenCalledWith('image/jpeg')
    expect(spy).toHaveBeenCalledWith(mockBlob)
    expect(result).toBe(mockImageData)
  })

  it('throws when clipboard read is rejected', async () => {
    mockRead.mockRejectedValue(new Error('Permission denied'))
    await expect(getImageDataFromClipboard()).rejects.toThrow('Permission denied')
  })
})
