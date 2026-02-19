import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as imageModule from '../../src/ImageData/imageDataToImgBlob'
import { writeImageDataToClipboard } from '../../src/Clipboard/writeImageDataToClipboard'
import * as clipboardModule from '../../src/Clipboard/writeImgBlobToClipboard'
import { useOffscreenCanvasMock } from '../_helpers/OffscreenCanvasMock'

describe('writeImageDataToClipboard', () => {
  beforeEach(() => {
    useOffscreenCanvasMock()
  })

  it('should convert imageData to blob and then write to clipboard', async () => {
    const mockImageData = {
      width: 10,
      height: 10,
    } as ImageData

    const mockBlob = new Blob(['data'], {
      type: 'image/png',
    })

    const blobSpy = vi.spyOn(imageModule, 'imageDataToImgBlob')
    const clipSpy = vi.spyOn(clipboardModule, 'writeImgBlobToClipboard')

    blobSpy.mockResolvedValue(mockBlob)

    clipSpy.mockResolvedValue(undefined)

    await writeImageDataToClipboard(mockImageData)

    expect(blobSpy).toHaveBeenCalledWith(mockImageData)

    expect(clipSpy).toHaveBeenCalledWith(mockBlob)

    blobSpy.mockRestore()

    clipSpy.mockRestore()
  })

  it('should propagate errors from imageDataToImgBlob', async () => {
    const blobSpy = vi.spyOn(imageModule, 'imageDataToImgBlob')

    blobSpy.mockRejectedValue(new Error('Conversion failed'))

    const imageData = {} as ImageData

    await expect(writeImageDataToClipboard(imageData)).rejects.toThrow('Conversion failed')

    blobSpy.mockRestore()
  })
})
