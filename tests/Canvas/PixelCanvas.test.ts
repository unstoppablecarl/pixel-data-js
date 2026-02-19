import { createCanvas } from '@napi-rs/canvas'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makePixelCanvas } from '../../src'
import { CANVAS_CTX_FAILED } from '../../src/Canvas/_constants'

describe('makePixelCanvas', () => {

  it('initializes with imageSmoothingEnabled set to false', () => {
    const spy = vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        const mockCanvas = createCanvas(100, 100)
        return mockCanvas as any
      }

      return document.createElement(tagName)
    })

    const canvas = document.createElement('canvas')
    const pixelCanvas = makePixelCanvas(canvas)

    expect(pixelCanvas.ctx.imageSmoothingEnabled).toBe(false)

    spy.mockRestore()
  })

  it('updates dimensions and reapplies smoothing fix on resize', () => {
    const canvas = createCanvas(10, 10) as unknown as HTMLCanvasElement
    const pixelCanvas = makePixelCanvas(canvas)

    pixelCanvas.resize(50, 60)

    expect(pixelCanvas.canvas.width).toBe(50)
    expect(pixelCanvas.canvas.height).toBe(60)
    expect(pixelCanvas.ctx.imageSmoothingEnabled).toBe(false)
  })

  it('throws an error if the 2D context is unavailable', () => {
    const canvas = createCanvas(1, 1) as unknown as HTMLCanvasElement

    // Force getContext to return null
    vi.spyOn(canvas, 'getContext').mockReturnValue(null)

    expect(() => makePixelCanvas(canvas)).toThrow(CANVAS_CTX_FAILED)
  })

  it('maintains the same canvas and context instances in the returned object', () => {
    const canvas = createCanvas(1, 1) as unknown as HTMLCanvasElement
    const pixelCanvas = makePixelCanvas(canvas)

    expect(pixelCanvas.canvas).toBe(canvas)
    expect(pixelCanvas.ctx).toBe(canvas.getContext('2d'))
  })
})
