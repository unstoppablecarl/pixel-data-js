import { ERRORS, makeColorPaintBufferCanvasRenderer, makePixelTile } from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('ColorPaintBufferCanvasRenderer', () => {
  it('throws an error if the context cannot be initialized', () => {
    const mockBuffer = {
      config: {
        tileSize: 256,
        tileShift: 8,
      },
      lookup: [],
    }

    const badFactory = () => ({
      getContext() {
        return null
      },
    })

    expect(() => makeColorPaintBufferCanvasRenderer(mockBuffer as any, badFactory as any)).toThrowError(ERRORS.CANVAS_CTX_FAILED)
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
    const mockCanvasFactory = vi.fn().mockReturnValue({
      getContext: getContextSpy,
    })

    makeColorPaintBufferCanvasRenderer(mockBuffer as any, mockCanvasFactory as any)

    expect(mockCanvasFactory).toHaveBeenCalledWith(256, 256)
    expect(getContextSpy).toHaveBeenCalledWith('2d')
    expect(mockCtx.imageSmoothingEnabled).toBe(false)
  })

  it('safely skips empty tiles and accurately draws valid tiles to the target using bitwise shifts', () => {

    const tileSize = 256
    const tileA = makePixelTile(
      98,
      1,
      2,
      tileSize,
      tileSize * tileSize
    )

    const tileB = undefined

    const tileC = makePixelTile(
      99,
      3,
      0,
      tileSize,
      tileSize * tileSize
    )

    const mockBuffer = {
      config: {
        tileSize,
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

    const canvasFactory = () => internalCanvasInstance

    const drawPaintBuffer = makeColorPaintBufferCanvasRenderer(mockBuffer as any, canvasFactory as any)

    const targetCtx = {
      drawImage: vi.fn(),
    }

    drawPaintBuffer(targetCtx as any)

    expect(internalCtx.putImageData).toHaveBeenNthCalledWith(1, tileA.imageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenNthCalledWith(1, internalCanvasInstance, 256, 512)

    expect(internalCtx.putImageData).toHaveBeenNthCalledWith(2, tileC.imageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenNthCalledWith(2, internalCanvasInstance, 768, 0)

    expect(targetCtx.drawImage).toHaveBeenCalledTimes(2)
  })

  it('should handle custom canvas factory', () => {
    const ctx = vi.fn()
    const canvas = {
      getContext: vi.fn().mockReturnValue(ctx),
    }
    const customFactory = vi.fn().mockReturnValue(canvas)

    const mockBuffer = {
      config: {
        tileSize: 256,
        tileShift: 8,
      },
      lookup: [],
    }
    makeColorPaintBufferCanvasRenderer(mockBuffer as any, customFactory as any)

    expect(customFactory).toHaveBeenCalledOnce()
    expect(canvas.getContext).toHaveBeenCalledExactlyOnceWith('2d')
  })
})
