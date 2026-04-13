import type { Color32 } from '@/_types'
import { makeBinaryMaskPaintBufferCanvasRenderer, makeBinaryMaskTile } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('BinaryMaskPaintBufferCanvasRenderer', () => {
  const tileSize = 4

  let mockConfig: any
  let mockLookup: any[]
  let mockPaintBuffer: any
  let mockTargetCtx: any

  function makeFactory() {
    const ctx = { putImageData: vi.fn(), imageSmoothingEnabled: true }
    const canvas = {}
    const getBuffer = vi.fn().mockReturnValue({ ctx, canvas })
    const factory = vi.fn().mockReturnValue(getBuffer)
    return { factory, getBuffer, ctx, canvas }
  }

  beforeEach(() => {
    mockConfig = {
      tileSize,
      tileShift: 2,
      tileArea: tileSize * tileSize,
    }
    mockLookup = []
    mockPaintBuffer = {
      config: mockConfig,
      lookup: mockLookup,
    }
    mockTargetCtx = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      drawImage: vi.fn(),
    }
  })

  describe('Factory Initialization', () => {
    it('calls the outer factory once on construction', () => {
      const { factory } = makeFactory()
      makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      expect(factory).toHaveBeenCalledOnce()
    })

    it('calls getBuffer with tileSize x tileSize during initial setBuffer', () => {
      const { factory, getBuffer } = makeFactory()
      makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      expect(getBuffer).toHaveBeenCalledWith(tileSize, tileSize)
    })
  })

  describe('Guard Clauses', () => {
    it('returns early if alpha parameter is 0', () => {
      const { factory } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      mockLookup[0] = makeBinaryMaskTile(1, 0, 0, tileSize, tileSize * tileSize)

      renderer.draw(mockTargetCtx, 0xFFFFFFFF as Color32, 0)

      expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
    })

    it('returns early if color alpha component is 0', () => {
      const { factory } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      mockLookup[0] = makeBinaryMaskTile(1, 0, 0, tileSize, tileSize * tileSize)

      renderer.draw(mockTargetCtx, 0x00FFFFFF as Color32)

      expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
    })

    it('skips undefined tiles in the lookup', () => {
      const { factory, ctx } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      mockLookup[0] = undefined
      mockLookup[1] = undefined

      renderer.draw(mockTargetCtx, 0xFFFFFFFF as Color32)

      expect(ctx.putImageData).not.toHaveBeenCalled()
      expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()
    })
  })

  describe('Rendering Logic', () => {
    it('fills pixels where mask value is 1 and leaves others at 0', () => {
      const { factory, ctx } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      const tile = makeBinaryMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tile.data[0] = 1
      tile.data[1] = 0
      tile.data[5] = 1
      mockLookup[0] = tile

      const color = 0xABCDEF12 as Color32
      renderer.draw(mockTargetCtx, color)

      const imageData = ctx.putImageData.mock.calls[0][0] as ImageData
      const view32 = new Uint32Array(imageData.data.buffer)

      expect(view32[0]).toBe(color)
      expect(view32[1]).toBe(0)
      expect(view32[5]).toBe(color)
    })

    it('clears bridge memory between tiles to prevent ghost pixels', () => {
      const { factory, ctx } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      const tileA = makeBinaryMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tileA.data[0] = 1

      const tileB = makeBinaryMaskTile(2, 1, 1, tileSize, tileSize * tileSize)
      // tileB.data[0] intentionally left at 0

      mockLookup[0] = tileA
      mockLookup[1] = tileB

      renderer.draw(mockTargetCtx, 0xFFFFFFFF as Color32)

      const tileBImageData = ctx.putImageData.mock.calls[1][0] as ImageData
      const view32 = new Uint32Array(tileBImageData.data.buffer)

      expect(view32[0]).toBe(0)
    })

    it('draws each tile at tile.x and tile.y coordinates', () => {
      const { factory, canvas } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      const tileA = makeBinaryMaskTile(1, 1, 2, tileSize, tileSize * tileSize)
      const tileB = makeBinaryMaskTile(2, 3, 0, tileSize, tileSize * tileSize)
      mockLookup[0] = tileA
      mockLookup[1] = tileB

      renderer.draw(mockTargetCtx, 0xFFFFFFFF as Color32)

      expect(mockTargetCtx.drawImage).toHaveBeenNthCalledWith(1, canvas, tileA.x, tileA.y)
      expect(mockTargetCtx.drawImage).toHaveBeenNthCalledWith(2, canvas, tileB.x, tileB.y)
      expect(mockTargetCtx.drawImage).toHaveBeenCalledTimes(2)
    })

    it('temporarily mutates and safely restores targetCtx global state', () => {
      const { factory } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      mockLookup[0] = makeBinaryMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      mockLookup[0].data.fill(1)

      const globalAlphaSetter = vi.fn()
      const globalCompSetter = vi.fn()

      const trackableCtx = {
        set globalAlpha(val: number) { globalAlphaSetter(val) },
        set globalCompositeOperation(val: string) { globalCompSetter(val) },
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      renderer.draw(trackableCtx, 0xFFFFFFFF as Color32, 128, 'destination-out')

      expect(globalAlphaSetter).toHaveBeenNthCalledWith(1, 128 / 255)
      expect(globalCompSetter).toHaveBeenNthCalledWith(1, 'destination-out')
      expect(globalAlphaSetter).toHaveBeenLastCalledWith(1)
      expect(globalCompSetter).toHaveBeenLastCalledWith('source-over')
    })
  })

  describe('setBuffer', () => {
    it('reflects the updated lookup after setBuffer is called', () => {
      const { factory } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      renderer.draw(mockTargetCtx, 0xFFFFFFFF as Color32)
      expect(mockTargetCtx.drawImage).not.toHaveBeenCalled()

      const tile = makeBinaryMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tile.data.fill(1)

      renderer.setBuffer({ config: mockConfig, lookup: [tile] } as any)
      renderer.draw(mockTargetCtx, 0xFFFFFFFF as Color32)

      expect(mockTargetCtx.drawImage).toHaveBeenCalledOnce()
    })

    it('reallocates getBuffer when the new buffer has a different tileSize', () => {
      const { factory, getBuffer } = makeFactory()
      const renderer = makeBinaryMaskPaintBufferCanvasRenderer(mockPaintBuffer, factory as any)

      const largerConfig = { tileSize: 512, tileShift: 9, tileArea: 512 * 512 }
      renderer.setBuffer({ config: largerConfig, lookup: [] } as any)

      expect(getBuffer).toHaveBeenCalledWith(512, 512)
    })
  })
})
