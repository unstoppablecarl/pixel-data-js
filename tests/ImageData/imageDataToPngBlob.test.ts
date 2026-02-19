import { beforeEach, describe, expect, it, vi } from 'vitest'
import { imageDataToPngBlob } from '../../src'
import {
  OffscreenCanvasMock,
  offscreenCanvasMockContext,
  useOffscreenCanvasMock,
} from '../_helpers/OffscreenCanvasMock'

describe('imageDataToPngBlob', () => {
  beforeEach(() => {
    useOffscreenCanvasMock()
  })

  it('successfully converts ImageData to a Blob and verifies pixel data', async () => {
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

    // Spy on the stable context and the prototype
    const putImageDataSpy = vi.spyOn(
      offscreenCanvasMockContext,
      'putImageData',
    )

    const convertToBlobSpy = vi.spyOn(
      OffscreenCanvasMock.prototype,
      'convertToBlob',
    )

    const blob = await imageDataToPngBlob(imageData)

    // Now these will correctly track the calls made inside the function
    expect(putImageDataSpy).toHaveBeenCalledWith(
      imageData,
      0,
      0,
    )

    expect(convertToBlobSpy).toHaveBeenCalledWith({
      type: 'image/png',
    })

    expect(blob.type).toBe('image/png')
  })

  it('throws an error if the 2d context cannot be created', async () => {
    // 1. Force getContext to return null just for this test
    const getContextSpy = vi.spyOn(
      OffscreenCanvasMock.prototype,
      'getContext',
    )

    getContextSpy.mockReturnValue(null)

    // 2. Setup dummy data
    const data = new Uint8ClampedArray([
      0,
      0,
      0,
      0,
    ])

    const imageData = new ImageData(
      data,
      1,
      1,
    )

    // 3. Assert that it throws the specific error message from your code
    await expect(imageDataToPngBlob(imageData)).rejects.toThrow('could not create 2d context')

    // 4. Cleanup is handled by beforeEach/afterEach usually,
    // but you can be explicit:
    getContextSpy.mockRestore()
  })
})
