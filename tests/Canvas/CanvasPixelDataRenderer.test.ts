import { makeCanvasPixelDataRenderer, type PixelData } from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { canvasToTestPixelData, makeTestPixelData, pack } from '../_helpers'
import { useOffscreenCanvasProxy } from '../_helpers/OffscreenCanvasProxy'

describe('makePixelCanvas', () => {
  const cyan = pack(0, 255, 255, 255)
  const red = pack(255, 0, 0, 255)
  const C = cyan
  const r = red

  it('default behavior', () => {

    useOffscreenCanvasProxy()

    const renderer = makeCanvasPixelDataRenderer()

    const content = [
      C, r, C,
      r, C, r,
      C, r, C,
    ]

    const pixelData = makeTestPixelData(3, 3, content)

    let result: PixelData | null = null

    const targetCtx = {
      drawImage(canvas: HTMLCanvasElement | OffscreenCanvas, x = 0, y = 0) {
        result = canvasToTestPixelData(canvas)
      },
    } as unknown as CanvasRenderingContext2D

    renderer(targetCtx, pixelData)

    expect(result).toMatchPixelGrid(content)
  })

  it('default spy canvas factory', () => {

    const ctx = {
      putImageData: vi.fn(),
    }
    const canvas = {
      test: 'canvas',
    }
    const factory = vi.fn().mockReturnValue({
      canvas,
      ctx,
    })

    const metaFactory = vi.fn().mockReturnValue(factory)

    const renderer = makeCanvasPixelDataRenderer(metaFactory as any,
    )

    const targetCtx = {
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

    const imageData = {
      foo: 'bar',
    }

    const pixelData = {
      imageData,
      w: 9,
      h: 10,
    } as unknown as PixelData

    const x = 3
    const y = 4

    renderer(targetCtx, pixelData, x, y)

    expect(metaFactory).toHaveBeenCalledOnce()
    expect(factory).toHaveBeenCalledExactlyOnceWith(pixelData.w, pixelData.h)
    expect(ctx.putImageData).toHaveBeenCalledExactlyOnceWith(imageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenCalledExactlyOnceWith(canvas, x, y)
  })
})
