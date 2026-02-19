import { createCanvas } from '@napi-rs/canvas'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { imageDataToPngBlob } from '../../src'

describe('imageDataToPngBlob', () => {
  beforeEach(() => {
    // Reset global state if you want to test the initialization branch
    vi.restoreAllMocks()

    imageDataToPngBlob.reset()
  })

  it('successfully converts ImageData to a Blob', async () => {
    // Create a tiny 1x1 ImageData object
    const data = new Uint8ClampedArray([255, 0, 0, 255])
    const imageData = new ImageData(data, 1, 1)

    // In a real JSDOM environment, toBlob is usually mocked or provided by the canvas package
    const blob = await imageDataToPngBlob(imageData)

    expect(blob).toBeDefined()
    expect(blob.type).toBe('image/png')
  })

  it('rejects the promise if toBlob returns null', async () => {
    const data = new Uint8ClampedArray([0, 0, 0, 0])
    const imageData = new ImageData(data, 1, 1)

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        const canvas = createCanvas(1, 1)

        // The browser's toBlob doesn't throw; it returns null to the callback on failure
        canvas.toBlob = (callback) => {
          callback(null)
        }

        return canvas as unknown as HTMLCanvasElement
      }

      return document.createElement(tagName)
    })

    // This will now catch the reject(new Error(...)) from your function
    await expect(imageDataToPngBlob(imageData)).rejects.toThrow(
      'Failed to generate PNG blob',
    )
  })
})
