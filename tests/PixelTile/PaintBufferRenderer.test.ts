import { makePaintBufferRenderer } from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('makePaintBufferRenderer', () => {
  it('throws an error if the context cannot be initialized', () => {
    const mockBuffer = {
      config: {
        tileSize: 256,
        tileShift: 8,
      },
      lookup: [],
    }

    class BadOffscreenCanvas {
      constructor(_w: number, _h: number) {
      }

      getContext() {
        return null
      }
    }

    expect(() => makePaintBufferRenderer(mockBuffer as any, BadOffscreenCanvas as any)).toThrowError('Failed to create Canvas context')
  })

  it('initializes the offscreen canvas with correct dimensions and disables smoothing', () => {
    const mockBuffer = {
      config: {
        tileSize: 256,
        tileShift: 8,
      },
      lookup: [],
    }

    const mockCtx = {
      imageSmoothingEnabled: true,
    }

    const getContextSpy = vi.fn(() => mockCtx)
    const constructorSpy = vi.fn()

    class MockCanvas {
      constructor(w: number, h: number) {
        constructorSpy(w, h)
      }

      getContext = getContextSpy
    }

    makePaintBufferRenderer(mockBuffer as any, MockCanvas as any)

    expect(constructorSpy).toHaveBeenCalledWith(256, 256)
    expect(getContextSpy).toHaveBeenCalledWith('2d')
    expect(mockCtx.imageSmoothingEnabled).toBe(false)
  })

  it('safely skips empty tiles and accurately draws valid tiles to the target using bitwise shifts', () => {
    const mockImageData = new ImageData(256, 256)

    const tileA = {
      tx: 1,
      ty: 2,
      imageData: mockImageData,
    }

    const tileB = undefined

    const tileC = {
      tx: 3,
      ty: 0,
      imageData: mockImageData,
    }

    const mockBuffer = {
      config: {
        tileSize: 256,
        tileShift: 8,
      },
      lookup: [
        tileA,
        tileB,
        tileC,
      ],
    }

    const internalCtx = {
      putImageData: vi.fn(),
      imageSmoothingEnabled: true,
    }

    const internalCanvasInstance = {
      getContext: vi.fn(() => internalCtx),
    }

    class MockCanvas {
      constructor() {
        return internalCanvasInstance
      }
    }

    const drawPaintBuffer = makePaintBufferRenderer(mockBuffer as any, MockCanvas as any)

    const targetCtx = {
      drawImage: vi.fn(),
    }

    drawPaintBuffer(targetCtx as any)

    expect(internalCtx.putImageData).toHaveBeenNthCalledWith(1, mockImageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenNthCalledWith(1, internalCanvasInstance, 256, 512)

    expect(internalCtx.putImageData).toHaveBeenNthCalledWith(2, mockImageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenNthCalledWith(2, internalCanvasInstance, 768, 0)

    expect(targetCtx.drawImage).toHaveBeenCalledTimes(2)
  })
})
