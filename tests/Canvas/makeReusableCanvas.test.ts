import { createCanvas } from '@napi-rs/canvas'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeReusableCanvas } from '../../src/Canvas/makeReusableCanvas'

describe('makeReusableCanvas', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('initializes and resizes correctly using a mocked canvas', () => {
    const get = makeReusableCanvas()

    const spy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        const mockCanvas = createCanvas(1, 1)
        return mockCanvas as any
      }

      return document.createElement(tagName)
    })

    const { canvas } = get(150, 200)

    expect(spy).toHaveBeenCalledWith('canvas')
    expect(canvas.width).toBe(150)
    expect(canvas.height).toBe(200)
  })

  it('manually clears when dimensions match', () => {
    const get = makeReusableCanvas()
    const {
      canvas,
      ctx,
    } = get(100, 100)

    const clearSpy = vi.spyOn(ctx, 'clearRect')

    // Trigger the 'else' branch (same size)
    get(100, 100)

    expect(clearSpy).toHaveBeenCalledWith(0, 0, 100, 100)
  })

  it('hits the error branch when context is null', () => {
    const get = makeReusableCanvas()

    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        const mockCanvas = createCanvas(1, 1)
        // Force getContext to fail
        mockCanvas.getContext = () => null as any
        return mockCanvas as any
      }

      return document.createElement(tagName)
    })

    expect(() => get(10, 10)).toThrow('Canvas context unavailable')
  })

  it('correctly resets closure state', () => {
    const get = makeReusableCanvas()

    const firstCall = get(10, 10)

    get.reset()

    const spy = vi.spyOn(document, 'createElement')
    const secondCall = get(10, 10)

    // Verify createElement was called again after reset
    expect(spy).toHaveBeenCalled()
    expect(firstCall.canvas).not.toBe(secondCall.canvas)
  })
})
