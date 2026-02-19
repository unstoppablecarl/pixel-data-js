import { describe, expect, it, vi } from 'vitest'
import { getImageDataFromClipboard } from '../../src/Clipboard/getImageDataFromClipboard'
import * as imageModule from '../../src/ImageData/imgBlobToImageData'

describe('getImageDataFromClipboard', () => {
  it('should return null if clipboardData is missing', async () => {
    const event = {} as ClipboardEvent

    const result = await getImageDataFromClipboard(event)

    expect(result).toBeNull()
  })

  it('should extract and convert an image item', async () => {
    const mockImageData = {
      width: 10,
      height: 10,
    } as ImageData

    const spy = vi.spyOn(imageModule, 'imgBlobToImageData')

    spy.mockResolvedValue(mockImageData)

    const mockBlob = new Blob()

    const mockItem = {
      type: 'image/png',
      getAsFile: () => {
        return mockBlob
      },
    }

    const event = {
      clipboardData: {
        items: [mockItem],
      },
    } as unknown as ClipboardEvent

    const result = await getImageDataFromClipboard(event)

    expect(spy).toHaveBeenCalledWith(mockBlob)

    expect(result).toBe(mockImageData)
  })

  it('should skip non-image items', async () => {
    const textItem = {
      type: 'text/plain',
      getAsFile: () => {
        return null
      },
    }

    const event = {
      clipboardData: {
        items: [textItem],
      },
    } as unknown as ClipboardEvent

    const result = await getImageDataFromClipboard(event)

    expect(result).toBeNull()
  })
  it('should continue to the next item if getAsFile returns null', async () => {
    const mockImageData = {
      width: 50,
      height: 50,
    } as ImageData

    const spy = vi.spyOn(imageModule, 'imgBlobToImageData')

    spy.mockResolvedValue(mockImageData)

    // First item claims to be an image but fails to provide a blob
    const corruptItem = {
      type: 'image/png',
      getAsFile: () => {
        return null
      },
    }

    // Second item is a valid image
    const validBlob = new Blob()

    const validItem = {
      type: 'image/png',
      getAsFile: () => {
        return validBlob
      },
    }

    const event = {
      clipboardData: {
        items: [
          corruptItem,
          validItem,
        ],
      },
    } as unknown as ClipboardEvent

    const result = await getImageDataFromClipboard(event)

    // Verify it skipped the first and processed the second
    expect(spy).toHaveBeenCalledTimes(1)

    expect(spy).toHaveBeenCalledWith(validBlob)

    expect(result).toBe(mockImageData)
  })
})
