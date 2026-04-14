import { makeColorPaintBufferCanvasRenderer, makePixelTile } from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('ColorPaintBufferCanvasRenderer', () => {
  it('calls the factory once on initialization and defers getBuffer until draw', () => {
    const mockBuffer = {
      config: { tileSize: 256 },
      lookup: [],
    }

    const mockGetBuffer = vi.fn().mockReturnValue({ ctx: {}, canvas: {} })
    const mockFactory = vi.fn().mockReturnValue(mockGetBuffer)

    makeColorPaintBufferCanvasRenderer(mockBuffer as any, mockFactory as any)

    expect(mockFactory).toHaveBeenCalledOnce()
    expect(mockGetBuffer).not.toHaveBeenCalled()
  })

  it('calls getBuffer with tileSize x tileSize dimensions on each draw call', () => {
    const tileSize = 256
    const mockBuffer = {
      config: { tileSize },
      lookup: [],
    }

    const mockGetBuffer = vi.fn().mockReturnValue({ ctx: { putImageData: vi.fn() }, canvas: {} })
    const mockFactory = vi.fn().mockReturnValue(mockGetBuffer)

    const renderer = makeColorPaintBufferCanvasRenderer(mockBuffer as any, mockFactory as any)
    renderer.draw({ drawImage: vi.fn() } as any)

    expect(mockGetBuffer).toHaveBeenCalledWith(tileSize, tileSize)
  })

  it('safely skips empty tiles and draws valid tiles using tile.x and tile.y directly', () => {
    const tileSize = 256
    const tileA = makePixelTile(98, 1, 2, tileSize, tileSize * tileSize)
    const tileB = undefined
    const tileC = makePixelTile(99, 3, 0, tileSize, tileSize * tileSize)

    const mockBuffer = {
      config: { tileSize },
      lookup: [tileA, tileB, tileC],
    }

    const internalCtx = { putImageData: vi.fn() }
    const internalCanvas = {}
    const mockGetBuffer = vi.fn().mockReturnValue({ ctx: internalCtx, canvas: internalCanvas })
    const canvasFactory = vi.fn().mockReturnValue(mockGetBuffer)

    const renderer = makeColorPaintBufferCanvasRenderer(mockBuffer as any, canvasFactory as any)
    const targetCtx = { drawImage: vi.fn() }

    renderer.draw(targetCtx as any)

    expect(internalCtx.putImageData).toHaveBeenNthCalledWith(1, tileA.imageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenNthCalledWith(1, internalCanvas, tileA.x, tileA.y)

    expect(internalCtx.putImageData).toHaveBeenNthCalledWith(2, tileC.imageData, 0, 0)
    expect(targetCtx.drawImage).toHaveBeenNthCalledWith(2, internalCanvas, tileC.x, tileC.y)

    expect(targetCtx.drawImage).toHaveBeenCalledTimes(2)
  })

  it('reflects the updated buffer after setBuffer is called', () => {
    const tileSize = 256
    const tile = makePixelTile(1, 0, 0, tileSize, tileSize * tileSize)

    const initialBuffer = { config: { tileSize }, lookup: [] }
    const updatedBuffer = { config: { tileSize }, lookup: [tile] }

    const internalCtx = { putImageData: vi.fn() }
    const mockGetBuffer = vi.fn().mockReturnValue({ ctx: internalCtx, canvas: {} })
    const canvasFactory = vi.fn().mockReturnValue(mockGetBuffer)

    const renderer = makeColorPaintBufferCanvasRenderer(initialBuffer as any, canvasFactory as any)
    const targetCtx = { drawImage: vi.fn() }

    renderer.draw(targetCtx as any)
    expect(targetCtx.drawImage).not.toHaveBeenCalled()

    renderer.setBuffer(updatedBuffer as any)
    renderer.draw(targetCtx as any)
    expect(targetCtx.drawImage).toHaveBeenCalledOnce()
  })

  it('constructs without throwing when no custom factory is provided', () => {
    const mockBuffer = {
      config: { tileSize: 256 },
      lookup: [],
    }

    expect(() => makeColorPaintBufferCanvasRenderer(mockBuffer as any)).not.toThrow()
  })
})
