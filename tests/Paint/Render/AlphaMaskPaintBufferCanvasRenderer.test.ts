import type { Color32 } from '@/_types'
import { AlphaMaskPaintBuffer, makeAlphaMaskPaintBufferCanvasRenderer, makeAlphaMaskTile } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('AlphaMaskPaintBufferCanvasRenderer', () => {
  const tileSize = 8

  let config: any
  let lookup: any[]
  let paintBuffer: AlphaMaskPaintBuffer
  let targetCtx: any

  function makeFactory() {
    const ctx = { putImageData: vi.fn(), imageSmoothingEnabled: true }
    const canvas = {}
    const getBuffer = vi.fn().mockReturnValue({ ctx, canvas })
    const factory = vi.fn().mockReturnValue(getBuffer)
    return { factory, getBuffer, ctx, canvas }
  }

  beforeEach(() => {
    config = {
      tileSize,
      tileShift: 3,
      tileArea: tileSize * tileSize,
    }
    lookup = []
    paintBuffer = { config, lookup } as unknown as AlphaMaskPaintBuffer
    targetCtx = {
      globalAlpha: 1,
      globalCompositeOperation: 'source-over',
      drawImage: vi.fn(),
    }
  })

  describe('Factory Initialization', () => {
    it('calls the outer factory once on construction', () => {
      const { factory } = makeFactory()
      makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      expect(factory).toHaveBeenCalledOnce()
    })

    it('calls getBuffer with tileSize x tileSize during initial setBuffer', () => {
      const { factory, getBuffer } = makeFactory()
      makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      expect(getBuffer).toHaveBeenCalledWith(tileSize, tileSize)
    })
  })

  describe('Guard Clauses', () => {
    it('returns early if alpha parameter is 0', () => {
      const { factory } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      lookup[0] = makeAlphaMaskTile(1, 0, 0, tileSize, tileSize * tileSize)

      renderer.draw(targetCtx, 0xFFFFFFFF as Color32, 0)

      expect(targetCtx.drawImage).not.toHaveBeenCalled()
    })

    it('returns early if color alpha component is 0', () => {
      const { factory } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      lookup[0] = makeAlphaMaskTile(1, 0, 0, tileSize, tileSize * tileSize)

      renderer.draw(targetCtx, 0x00FFFFFF as Color32)

      expect(targetCtx.drawImage).not.toHaveBeenCalled()
    })

    it('skips undefined tiles in the lookup', () => {
      const { factory, ctx } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      lookup[0] = undefined
      lookup[1] = undefined

      renderer.draw(targetCtx, 0xFFFFFFFF as Color32)

      expect(ctx.putImageData).not.toHaveBeenCalled()
      expect(targetCtx.drawImage).not.toHaveBeenCalled()
    })
  })

  describe('Rendering Logic', () => {
    it('translates 8-bit mask values to 32-bit colors correctly', () => {
      const { factory, ctx } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      const tile = makeAlphaMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tile.data[0] = 0    // transparent — skip
      tile.data[1] = 255  // solid — use color as-is
      tile.data[2] = 128  // partial — blend
      lookup[0] = tile

      renderer.draw(targetCtx, 0xFF0000FF as Color32)

      const imageData = ctx.putImageData.mock.calls[0][0] as ImageData
      const view32 = new Uint32Array(imageData.data.buffer)

      expect(view32[0]).toBe(0)           // skipped
      expect(view32[1]).toBe(0xFF0000FF)  // solid
      expect(view32[2]).toBe(0x800000FF)  // blended
    })

    it('applies full alpha blending across all mask values correctly', () => {
      const { factory, ctx } = makeFactory()

      const smallConfig = { tileSize: 2, tileShift: 0, tileArea: 4 }
      const smallBuffer = { config: smallConfig, lookup: [] } as any
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(smallBuffer, factory as any)

      const tile = makeAlphaMaskTile(1, 0, 0, 2, 4)
      tile.data[0] = 255
      tile.data[1] = 0
      tile.data[2] = 128
      tile.data[3] = 1
      smallBuffer.lookup[0] = tile

      renderer.draw(targetCtx, 0xFF0000FF as Color32)

      const imageData = ctx.putImageData.mock.calls[0][0] as ImageData
      const view32 = new Uint32Array(imageData.data.buffer)

      expect(view32[0]).toBe(0xFF0000FF)
      expect(view32[1]).toBe(0x00000000)
      expect(view32[2]).toBe(0x800000FF)
      expect(view32[3]).toBe(0x010000FF)
    })

    it('clears bridge memory between tiles to prevent ghost pixels', () => {
      const { factory, ctx } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      const tileA = makeAlphaMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tileA.data[0] = 255

      const tileB = makeAlphaMaskTile(2, 1, 0, tileSize, tileSize * tileSize)
      // tileB.data[0] intentionally 0

      lookup[0] = tileA
      lookup[1] = tileB

      renderer.draw(targetCtx, 0xFFFFFFFF as Color32)

      const tileBImageData = ctx.putImageData.mock.calls[1][0] as ImageData
      const view32 = new Uint32Array(tileBImageData.data.buffer)

      expect(view32[0]).toBe(0)
    })

    it('draws each tile at tile.x and tile.y coordinates', () => {
      const { factory, canvas } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      const tileA = makeAlphaMaskTile(1, 2, 3, tileSize, tileSize * tileSize)
      const tileB = makeAlphaMaskTile(2, 5, 1, tileSize, tileSize * tileSize)
      lookup[0] = tileA
      lookup[1] = tileB

      renderer.draw(targetCtx, 0xFFFFFFFF as Color32)

      expect(targetCtx.drawImage).toHaveBeenNthCalledWith(1, canvas, tileA.x, tileA.y)
      expect(targetCtx.drawImage).toHaveBeenNthCalledWith(2, canvas, tileB.x, tileB.y)
      expect(targetCtx.drawImage).toHaveBeenCalledTimes(2)
    })

    it('temporarily mutates and safely restores targetCtx global state', () => {
      const { factory } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      const tile = makeAlphaMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tile.data.fill(255)
      lookup[0] = tile

      const globalAlphaSetter = vi.fn()
      const globalCompSetter = vi.fn()

      const trackableCtx = {
        set globalAlpha(val: number) {
          globalAlphaSetter(val)
        },
        set globalCompositeOperation(val: string) {
          globalCompSetter(val)
        },
        drawImage: vi.fn(),
      } as unknown as CanvasRenderingContext2D

      renderer.draw(trackableCtx, 0xFFFFFFFF as Color32, 128, 'destination-out')

      expect(globalAlphaSetter.mock.calls).toEqual([
        [128 / 255],
        [1],
      ])

      expect(globalAlphaSetter).toHaveBeenNthCalledWith(1, 128 / 255)
      expect(globalCompSetter).toHaveBeenNthCalledWith(1, 'destination-out')
      expect(globalAlphaSetter).toHaveBeenLastCalledWith(1)
      expect(globalCompSetter).toHaveBeenLastCalledWith('source-over')
    })
  })

  describe('setBuffer', () => {
    it('reflects the updated lookup after setBuffer is called', () => {
      const { factory } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      renderer.draw(targetCtx, 0xFFFFFFFF as Color32)
      expect(targetCtx.drawImage).not.toHaveBeenCalled()

      const tile = makeAlphaMaskTile(1, 0, 0, tileSize, tileSize * tileSize)
      tile.data.fill(255)

      renderer.setBuffer({ config, lookup: [tile] } as any)
      renderer.draw(targetCtx, 0xFFFFFFFF as Color32)

      expect(targetCtx.drawImage).toHaveBeenCalledOnce()
    })

    it('reallocates getBuffer when the new buffer has a different tileSize', () => {
      const { factory, getBuffer } = makeFactory()
      const renderer = makeAlphaMaskPaintBufferCanvasRenderer(paintBuffer, factory as any)

      const largerConfig = { tileSize: 512, tileShift: 9, tileArea: 512 * 512 }
      renderer.setBuffer({ config: largerConfig, lookup: [] } as any)

      expect(getBuffer).toHaveBeenCalledWith(512, 512)
    })
  })
})
