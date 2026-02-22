import { createCanvas } from '@napi-rs/canvas'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { imageDataToDataUrl } from '../../src'

describe('imageDataToDataUrl', () => {
  beforeEach(() => {
    imageDataToDataUrl.reset()
    vi.restoreAllMocks()
  })

  it('converts ImageData to a data URL string', () => {
    const mockCanvas = createCanvas(10, 10)
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tag) => {
      if (tag === 'canvas') {
        return mockCanvas as any
      }
      return document.createElement(tag)
    })

    const data = new Uint8ClampedArray(10 * 10 * 4)
    const img = new ImageData(data, 10, 10)

    const result = imageDataToDataUrl(img)

    // Verify it returns a data URL format
    expect(result).toContain('data:image/png;base64')
    expect(spy).toHaveBeenCalled()
  })

  it('correctly resets the internal canvas cache', () => {
    const spy = vi.spyOn(document, 'createElement')
    const img = new ImageData(1, 1)

    // First call creates canvas
    imageDataToDataUrl(img)
    const initialCalls = spy.mock.calls.length

    // Second call should reuse it (no new createElement)
    imageDataToDataUrl(img)
    expect(spy.mock.calls.length).toBe(initialCalls)

    // Reset and call again
    imageDataToDataUrl.reset()
    imageDataToDataUrl(img)
    expect(spy.mock.calls.length).toBe(initialCalls + 1)
  })
})
