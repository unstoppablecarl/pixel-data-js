import type { PixelCanvas } from '@/index'
import { makeCanvasFrameRenderer } from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('makeCanvasFrameRenderer', () => {
  it('executes the full rendering pipeline in the correct order', () => {
    const mockPxCtx = {
      putImageData: vi.fn(),
    }

    const mockPxCanvas = {
      width: 100,
      height: 100,
    }

    const mockBufferFactory = vi.fn().mockReturnValue({
      canvas: mockPxCanvas,
      ctx: mockPxCtx,
    })

    const renderCanvasFrame = makeCanvasFrameRenderer((() => mockBufferFactory) as any)

    const mockCtx = {
      setTransform: vi.fn(),
      clearRect: vi.fn(),
      drawImage: vi.fn(),
    }

    const mockCanvas = {
      width: 100,
      height: 100,
    }

    const pixelCanvas = {
      canvas: mockCanvas as any,
      ctx: mockCtx as any,
    } as PixelCanvas

    const mockImageData = new ImageData(10, 10)
    const getImageData = vi.fn(() => mockImageData)
    const drawPixelLayer = vi.fn()
    const drawScreenLayer = vi.fn()

    renderCanvasFrame(
      pixelCanvas,
      2.0, // scale
      getImageData,
      drawPixelLayer,
      drawScreenLayer,
    )

    // Verify Buffer Factory was called with correct dimensions
    expect(mockBufferFactory).toHaveBeenCalledWith(100, 100)

    // 1. Pixel Data writing
    expect(getImageData).toHaveBeenCalled()
    expect(mockPxCtx.putImageData).toHaveBeenCalledWith(mockImageData, 0, 0)
    expect(drawPixelLayer).toHaveBeenCalledWith(mockPxCtx)

    // 2. Main Canvas Clearing
    expect(mockCtx.setTransform).toHaveBeenNthCalledWith(1, 1, 0, 0, 1, 0, 0)
    expect(mockCtx.clearRect).toHaveBeenCalledWith(0, 0, 100, 100)

    // 3. Scaled Drawing
    expect(mockCtx.setTransform).toHaveBeenNthCalledWith(2, 2, 0, 0, 2, 0, 0)
    expect(mockCtx.drawImage).toHaveBeenCalledWith(mockPxCanvas, 0, 0)

    // 4. Screen Layer (Overlay) Drawing
    expect(mockCtx.setTransform).toHaveBeenNthCalledWith(3, 1, 0, 0, 1, 0, 0)
    expect(drawScreenLayer).toHaveBeenCalledWith(mockCtx, 2.0)
  })

  it('skips putImageData if getImageData returns null', () => {
    const mockPxCtx = {
      putImageData: vi.fn(),
    }

    const renderCanvasFrame = makeCanvasFrameRenderer((() => vi.fn().mockReturnValue({
        canvas: {},
        ctx: mockPxCtx,
      })) as any,
    )

    const pixelCanvas = {
      canvas: {
        width: 10,
        height: 10,
      },
      ctx: {
        setTransform: vi.fn(),
        clearRect: vi.fn(),
        drawImage: vi.fn(),
      },
    }

    renderCanvasFrame(
      pixelCanvas as any,
      1,
      () => null,
    )

    expect(mockPxCtx.putImageData).not.toHaveBeenCalled()
  })
})
