import {
  type CanvasFrameRenderer,
  type DrawPixelLayer,
  type DrawScreenLayer,
  makeCanvasFrameRenderer,
  makeReusableCanvas,
  type PixelCanvas,
} from '@/index'
import { describe, expect, expectTypeOf, it, vi } from 'vitest'

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

  describe('types', () => {

    describe('default (OffscreenCanvas)', () => {
      const renderer = makeCanvasFrameRenderer()

      it('returns a function', () => {
        expectTypeOf(renderer).toBeFunction()
      })

      it('has correct parameter signature', () => {
        expectTypeOf(renderer).parameters.toEqualTypeOf<[
          PixelCanvas,
          number,
          () => ImageData | undefined | null,
          DrawPixelLayer<OffscreenCanvas>?,
          DrawScreenLayer?,
        ]>()
      })

      it('drawPixelLayer ctx is OffscreenCanvasRenderingContext2D', () => {
        expectTypeOf(renderer).parameter(3).toEqualTypeOf<
        DrawPixelLayer<OffscreenCanvas> | undefined
        > ()
      })

      it('matches CanvasFrameRenderer default type alias', () => {
        expectTypeOf(renderer).toEqualTypeOf<CanvasFrameRenderer>()
      })
    })

    describe('explicit HTMLCanvasElement', () => {
      const renderer = makeCanvasFrameRenderer<HTMLCanvasElement>(makeReusableCanvas)

      it('drawPixelLayer ctx is CanvasRenderingContext2D', () => {
        expectTypeOf(renderer).parameter(3).toEqualTypeOf<
        DrawPixelLayer<HTMLCanvasElement> | undefined
        > ()
      })

      it('does not accept an OffscreenCanvas drawPixelLayer', () => {
        expectTypeOf(renderer).parameter(3).not.toEqualTypeOf<
        DrawPixelLayer < OffscreenCanvas >
        > ()
      })

      it('matches typed CanvasFrameRenderer alias', () => {
        expectTypeOf(renderer).toEqualTypeOf<CanvasFrameRenderer<HTMLCanvasElement>>()
      })
    })

    describe('DrawPixelLayer', () => {
      it('OffscreenCanvas variant receives OffscreenCanvasRenderingContext2D', () => {
        expectTypeOf<DrawPixelLayer<OffscreenCanvas>>().toBeFunction()
        expectTypeOf<DrawPixelLayer<OffscreenCanvas>>()
          .parameters.toEqualTypeOf<[OffscreenCanvasRenderingContext2D]>()
      })

      it('HTMLCanvasElement variant receives CanvasRenderingContext2D', () => {
        expectTypeOf<DrawPixelLayer<HTMLCanvasElement>>().toBeFunction()
        expectTypeOf<DrawPixelLayer<HTMLCanvasElement>>()
          .parameters.toEqualTypeOf<[CanvasRenderingContext2D]>()
      })

      it('HTMLCanvasElement variant does not accept OffscreenCanvasRenderingContext2D', () => {
        expectTypeOf<DrawPixelLayer<HTMLCanvasElement>>()
          .not.toEqualTypeOf<DrawPixelLayer<OffscreenCanvas>>()
      })

      it('OffscreenCanvas variant does not accept CanvasRenderingContext2D', () => {
        expectTypeOf<DrawPixelLayer<OffscreenCanvas>>()
          .not.toEqualTypeOf<DrawPixelLayer<HTMLCanvasElement>>()
      })
    })

    describe('DrawScreenLayer', () => {
      it('is a function taking ctx and scale', () => {
        expectTypeOf<DrawScreenLayer>().toBeFunction()
        expectTypeOf<DrawScreenLayer>()
          .parameters.toEqualTypeOf<[CanvasRenderingContext2D, number]>()
      })
    })

    describe('CanvasFrameRenderer type alias', () => {
      it('defaults to OffscreenCanvas', () => {
        expectTypeOf<CanvasFrameRenderer>()
          .toEqualTypeOf<CanvasFrameRenderer<OffscreenCanvas>>()
      })

      it('accepts HTMLCanvasElement generic', () => {
        expectTypeOf<CanvasFrameRenderer<HTMLCanvasElement>>().toBeFunction()
      })

      it('HTMLCanvasElement and OffscreenCanvas variants are not interchangeable', () => {
        expectTypeOf<CanvasFrameRenderer<HTMLCanvasElement>>()
          .not.toEqualTypeOf<CanvasFrameRenderer<OffscreenCanvas>>()
      })
    })
  })
})
