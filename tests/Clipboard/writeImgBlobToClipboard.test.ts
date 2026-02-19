import { beforeEach, describe, expect, it, vi } from 'vitest'
import { writeImgBlobToClipboard } from '../../src/Clipboard/writeImgBlobToClipboard'

describe('writeImgBlobToClipboard', () => {
  const mockWrite = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()

    // Mock the Clipboard API
    Object.assign(navigator, {
      clipboard: {
        write: mockWrite,
      },
    })

    // @ts-expect-error
    global.ClipboardItem = vi.fn().mockImplementation((data) => {
      return data
    })
  })

  it('should create a ClipboardItem and write it to the clipboard', async () => {
    const blob = new Blob(['data'], {
      type: 'image/png',
    })

    await writeImgBlobToClipboard(blob)

    expect(global.ClipboardItem).toHaveBeenCalledWith({
      'image/png': blob,
    })

    expect(mockWrite).toHaveBeenCalledWith([
      expect.any(Object),
    ])
  })

  it('should throw an error if the clipboard write fails', async () => {
    mockWrite.mockRejectedValue(new Error('Permission Denied'))

    const blob = new Blob()

    await expect(writeImgBlobToClipboard(blob)).rejects.toThrow('Permission Denied')
  })
})
