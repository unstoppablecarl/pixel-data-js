import {
  type Color32,
  makeCirclePaintAlphaMask,
  makeCirclePaintBinaryMask,
  PaintBuffer,
  PixelEngineConfig,
  type PixelTile,
  writePaintBufferToPixelData,
} from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPaintBuffer, makeTestPixelData } from '../_helpers'

describe('PaintBuffer', () => {

  function expectTileDataToEqual(tile: PixelTile | undefined, expected: number[]) {
    expect(Array.from(tile?.data32 ?? [])).toEqual(expected)
  }

  const color = 0xFF0000FF as Color32
  const C = color

  describe(`paintAlphaMask`, () => {
    it('should return false if alpha is 0', () => {
      const { paintBuffer, tilePool } = makeTestPaintBuffer(8)
      vi.spyOn(tilePool, 'getTile')
      const brush = makeCirclePaintAlphaMask(0, () => 1)
      const result = paintBuffer.paintAlphaMask(
        color,
        brush,
        1,
        0,
        0,
        0,
      )

      expect(result).toBe(false)
      expect(tilePool.getTile).not.toHaveBeenCalled()
    })

    it('should draw a single point', () => {
      const brush = makeCirclePaintAlphaMask(5)
      const { paintBuffer } = makeTestPaintBuffer(8)

      const x = 4
      const y = 5

      const changed = paintBuffer.paintAlphaMask(
        color,
        brush,
        x,
        y,
      )

      expect(changed).toBe(true)
      expect(paintBuffer.lookup.length).toBe(1)

      expectTileDataToEqual(paintBuffer.lookup[0], [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 436207871, 838861055, 436207871, 0, 0,
        0, 0, 436207871, 1845494015, 2566914303, 1845494015, 436207871, 0,
        0, 0, 838861055, 2566914303, 4278190335, 2566914303, 838861055, 0,
        0, 0, 436207871, 1845494015, 2566914303, 1845494015, 436207871, 0,
        0, 0, 0, 436207871, 838861055, 436207871, 0, 0,
      ])
    })

    it('should draw a multi tile stroke', () => {
      const brush = makeCirclePaintAlphaMask(5)
      const tileSize = 8
      const { paintBuffer, target } = makeTestPaintBuffer(tileSize, 4, 4)

      const x = 10
      const y = 12

      const changed = paintBuffer.paintAlphaMask(
        color,
        brush,
        x,
        y,
        x + 24,
        y + 26,
      )

      expect(changed).toBe(true)

      const dst = makeTestPixelData(target.w, target.h)

      writePaintBufferToPixelData(dst, paintBuffer)
      expect(dst).toMatchPixelDataSnapshot()
    })

    it('should return false if alpha is 0', () => {
      const { paintBuffer, tilePool } = makeTestPaintBuffer(8)
      vi.spyOn(tilePool, 'getTile')

      const result = paintBuffer.paintAlphaMask(
        0x00000000 as Color32,
        null as any,
        1,
        0,
        0,
        0,
      )

      expect(result).toBe(false)
      expect(tilePool.getTile).not.toHaveBeenCalled()
    })

  })

  describe(`paintBinaryMask`, () => {

    it('should draw a single point', () => {
      const brush = makeCirclePaintBinaryMask(3)
      const { paintBuffer } = makeTestPaintBuffer(8)

      const x = 4
      const y = 5

      const changed = paintBuffer.paintBinaryMask(
        color,
        brush,
        x,
        y,
      )

      expect(changed).toBe(true)
      expect(paintBuffer.lookup.length).toBe(1)

      expectTileDataToEqual(paintBuffer.lookup[0], [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, 0, 0, C, C, C, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ])
    })

    it('should draw a multi tile stroke', () => {
      const brush = makeCirclePaintBinaryMask(5)
      const tileSize = 8
      const { paintBuffer } = makeTestPaintBuffer(tileSize, 4, 4)

      const x = 10
      const y = 12

      const changed = paintBuffer.paintBinaryMask(
        color,
        brush,
        x,
        y,
        x + 24,
        y + 26,
      )
      const emptyTile = new Array(tileSize * tileSize).fill(0)

      expect(changed).toBe(true)

      expect(paintBuffer.lookup.length).toBe(16)

      expectTileDataToEqual(paintBuffer.lookup[5], [
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, C, C, 0, 0, 0, 0,
        C, C, C, C, C, 0, 0, 0,
        C, C, C, C, C, 0, 0, 0,
        C, C, C, C, C, C, 0, 0,
        C, C, C, C, C, C, C, 0,
        0, C, C, C, C, C, C, C,
      ])

      expectTileDataToEqual(paintBuffer.lookup[6], emptyTile)
      expect(paintBuffer.lookup[7]).toBe(undefined)
      expect(paintBuffer.lookup[8]).toBe(undefined)

      expectTileDataToEqual(paintBuffer.lookup[9], [
        0, 0, C, C, C, C, C, C,
        0, 0, 0, C, C, C, C, C,
        0, 0, 0, 0, C, C, C, C,
        0, 0, 0, 0, 0, C, C, C,
        0, 0, 0, 0, 0, 0, C, C,
        0, 0, 0, 0, 0, 0, 0, C,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ])

      expectTileDataToEqual(paintBuffer.lookup[10], [
        C, 0, 0, 0, 0, 0, 0, 0,
        C, C, 0, 0, 0, 0, 0, 0,
        C, C, C, 0, 0, 0, 0, 0,
        C, C, C, C, 0, 0, 0, 0,
        C, C, C, C, C, 0, 0, 0,
        C, C, C, C, C, C, 0, 0,
        C, C, C, C, C, C, C, 0,
        0, C, C, C, C, C, C, C,
      ])

      expectTileDataToEqual(paintBuffer.lookup[11], emptyTile)
      expect(paintBuffer.lookup[12]).toBe(undefined)
      expect(paintBuffer.lookup[13]).toBe(undefined)

      expectTileDataToEqual(paintBuffer.lookup[14], [
        0, 0, C, C, C, C, C, C,
        0, 0, 0, C, C, C, C, C,
        0, 0, 0, 0, C, C, C, C,
        0, 0, 0, 0, C, C, C, C,
        0, 0, 0, 0, 0, C, C, C,
        0, 0, 0, 0, 0, 0, C, C,
        0, 0, 0, 0, 0, 0, 0, C,
        0, 0, 0, 0, 0, 0, 0, 0,
      ])

      expectTileDataToEqual(paintBuffer.lookup[15], [
        C, 0, 0, 0, 0, 0, 0, 0,
        C, 0, 0, 0, 0, 0, 0, 0,
        C, C, 0, 0, 0, 0, 0, 0,
        C, C, C, 0, 0, 0, 0, 0,
        C, C, C, C, 0, 0, 0, 0,
        C, C, C, C, C, 0, 0, 0,
        C, C, C, C, C, C, 0, 0,
        C, C, C, C, C, C, C, 0,
      ])
    })

    it('should return false if alpha is 0', () => {
      const { paintBuffer, tilePool } = makeTestPaintBuffer(8)
      vi.spyOn(tilePool, 'getTile')

      const result = paintBuffer.paintBinaryMask(
        0x00000000 as Color32,
        null as any,
        1,
        0,
        0,
        0,
      )

      expect(result).toBe(false)
      expect(tilePool.getTile).not.toHaveBeenCalled()
    })
  })

  describe('paintRect', () => {
    it('should draw a single point', () => {
      const tileSize = 8
      const { paintBuffer } = makeTestPaintBuffer(tileSize)
      const x = 2
      const y = 2

      const result = paintBuffer.paintRect(
        color,
        1,
        1,
        x,
        y,
      )

      expect(result).toBe(true)

      expect(Array.from(paintBuffer.lookup[0]?.data32!)).toEqual([
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, C, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ])
    })

    it('should draw a multi tile stroke', () => {
      const tileSize = 8
      const { paintBuffer } = makeTestPaintBuffer(tileSize)
      const x = 1
      const y = 1

      const result = paintBuffer.paintRect(
        color,
        1,
        1,
        x,
        y,
        x + 10,
        y + 10,
      )

      expect(result).toBe(true)
      expect(paintBuffer.lookup.length).toBe(4)
      expect(Array.from(paintBuffer.lookup[0]?.data32!)).toEqual([
        0, 0, 0, 0, 0, 0, 0, 0,
        0, C, 0, 0, 0, 0, 0, 0,
        0, 0, C, 0, 0, 0, 0, 0,
        0, 0, 0, C, 0, 0, 0, 0,
        0, 0, 0, 0, C, 0, 0, 0,
        0, 0, 0, 0, 0, C, 0, 0,
        0, 0, 0, 0, 0, 0, C, 0,
        0, 0, 0, 0, 0, 0, 0, C,
      ])

      expect(paintBuffer.lookup[1]).toBe(undefined)
      expect(paintBuffer.lookup[2]).toBe(undefined)

      expect(Array.from(paintBuffer.lookup[3]?.data32!)).toEqual([
        C, 0, 0, 0, 0, 0, 0, 0,
        0, C, 0, 0, 0, 0, 0, 0,
        0, 0, C, 0, 0, 0, 0, 0,
        0, 0, 0, C, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0,
      ])
    })

    it('should return false if alpha is 0', () => {
      const { paintBuffer, tilePool } = makeTestPaintBuffer(8)
      vi.spyOn(tilePool, 'getTile')

      const result = paintBuffer.paintRect(
        0x00000000 as Color32,
        1,
        1,
        0,
        0,
        0,
        0,
      )

      expect(result).toBe(false)
      expect(tilePool.getTile).not.toHaveBeenCalled()
    })

    it('should return false if brush bounds are zero or negative', () => {
      const { paintBuffer } = makeTestPaintBuffer(8)

      // Using a 0x0 brush should trigger the scratch.w <= 0 check
      const result = paintBuffer.paintRect(
        color,
        0,
        0,
        10,
        10,
        10,
        10,
      )

      expect(result).toBe(false)
    })
  })

  describe('Tile Management', () => {
    it('should fetch new tiles only when needed', () => {
      const { paintBuffer, tilePool } = makeTestPaintBuffer(16)

      vi.spyOn(tilePool, 'getTile')

      paintBuffer.paintRect(
        color,
        1,
        1,
        10,
        10,
        10,
        10,
      )

      paintBuffer.paintRect(
        color,
        1,
        1,
        11,
        11,
        11,
        11,
      )

      // Both points are in the same tile (0,0), so it should only be fetched once
      expect(tilePool.getTile).toHaveBeenCalledTimes(1)
    })

    it('should fetch different tiles for distant points', () => {
      const { paintBuffer, tilePool } = makeTestPaintBuffer(16)

      vi.spyOn(tilePool, 'getTile')

      // Tile (0,0)
      paintBuffer.paintRect(
        color,
        1,
        1,
        10,
        10,
        10,
        10,
      )

      // // Tile (1,1) because size is 16
      paintBuffer.paintRect(
        color,
        1,
        1,
        20,
        20,
        20,
        20,
      )
      expect(tilePool.getTile).toHaveBeenCalledTimes(2)
    })

    it('should release lookup tiles back to the pool', () => {

      const { paintBuffer, tilePool } = makeTestPaintBuffer(16)

      vi.spyOn(tilePool, 'releaseTiles')

      paintBuffer.lookup[0] = { id: 0 } as any
      paintBuffer.clear()

      expect(tilePool.releaseTiles).toHaveBeenCalledWith(paintBuffer.lookup)
    })
  })

  describe('eachTileInBounds', () => {
    let config: PixelEngineConfig
    let tilePool: any
    let paintBuffer: any

    beforeEach(() => {
      const target = {
        w: 1024,
        h: 1024,
      } as any

      // 256px tile size (tileShift = 8)
      config = new PixelEngineConfig(
        256,
        target,
      )

      tilePool = {
        getTile: vi.fn((id, tx, ty) => {
          return {
            id: id,
            tx: tx,
            ty: ty,
          }
        }),
      }

      paintBuffer = new PaintBuffer(
        config,
        tilePool,
      )
    })

    it('should call the callback once for bounds within a single tile', () => {
      const callback = vi.fn()
      const bounds = {
        x: 10,
        y: 10,
        w: 50,
        h: 50,
      }

      paintBuffer['eachTileInBounds'](bounds, callback)

      expect(callback).toHaveBeenCalledTimes(1)
      // callback(tile, bX, bY, bW, bH) -> 5 args, so multi-line
      expect(callback).toHaveBeenCalledWith(
        expect.any(Object),
        10,
        10,
        50,
        50,
      )
    })

    it('should span two tiles horizontally when bounds cross the 256px mark', () => {
      const callback = vi.fn()
      const bounds = {
        x: 250,
        y: 10,
        w: 20,
        h: 10,
      }

      paintBuffer['eachTileInBounds'](bounds, callback)

      // Should call for tile (0,0) and tile (1,0)
      expect(callback).toHaveBeenCalledTimes(2)

      // First tile (0,0) part: x=250 to 256 (width 6)
      expect(callback).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ tx: 0, ty: 0 }),
        250,
        10,
        6,
        10,
      )

      // Second tile (1,0) part: x=256 to 270 (width 14)
      expect(callback).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ tx: 1, ty: 0 }),
        256,
        10,
        14,
        10,
      )
    })

    it('should iterate over 4 tiles (2x2) when bounds cross both X and Y boundaries', () => {
      const callback = vi.fn()
      const bounds = {
        x: 250,
        y: 250,
        w: 20,
        h: 20,
      }

      paintBuffer['eachTileInBounds'](bounds, callback)

      expect(callback).toHaveBeenCalledTimes(4)
    })

    it('should return early and not call the callback if bounds are out of range', () => {
      const callback = vi.fn()
      const bounds = {
        x: -100,
        y: -100,
        w: 50,
        h: 50,
      }

      paintBuffer['eachTileInBounds'](bounds, callback)

      expect(callback).not.toHaveBeenCalled()
    })
  })
})
