import {
  type Color32,
  ColorPaintBuffer,
  makeCirclePaintAlphaMask,
  makeCirclePaintBinaryMask,
  makePixelTile,
  makeTileTargetConfig,
  type PixelTile,
  TilePool,
  writePaintBufferToPixelData,
} from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestPaintRect, makeTestPixelData } from '../_helpers'

describe('ColorPaintBuffer', () => {

  function makeTestPaintBuffer(tileSize: number, w = 2, h = 2) {
    const target = makeTestPixelData(tileSize * w, tileSize * h)
    const config = makeTileTargetConfig(tileSize, target)
    const tilePool = new TilePool(config.tileSize, makePixelTile)
    const paintBuffer = new ColorPaintBuffer(config, tilePool)

    return {
      target,
      config,
      tilePool,
      paintBuffer,
    }
  }

  function expectTileDataToEqual(tile: PixelTile | undefined, expected: number[]) {
    expect(Array.from(tile?.data ?? [])).toEqual(expected)
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

    it('should draw a multi tile stroke', async () => {
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
      await expect(dst).toMatchPixelDataSnapshot()
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

      const brush = makeTestPaintRect(1, 1)

      const result = paintBuffer.paintRect(
        color,
        brush,
        x,
        y,
      )

      expect(result).toBe(true)

      expect(Array.from(paintBuffer.lookup[0]?.data!)).toEqual([
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
      const brush = makeTestPaintRect(1, 1)

      const result = paintBuffer.paintRect(
        color,
        brush,
        x,
        y,
        x + 10,
        y + 10,
      )

      expect(result).toBe(true)
      expect(paintBuffer.lookup.length).toBe(4)
      expect(Array.from(paintBuffer.lookup[0]?.data!)).toEqual([
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

      expect(Array.from(paintBuffer.lookup[3]?.data!)).toEqual([
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
      const brush = makeTestPaintRect(1, 1)

      const result = paintBuffer.paintRect(
        0x00000000 as Color32,
        brush,
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
      const brush = makeTestPaintRect(0, 0)

      // Using a 0x0 brush should trigger the scratch.w <= 0 check
      const result = paintBuffer.paintRect(
        color,
        brush,
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
      const brush = makeTestPaintRect(1, 1)

      paintBuffer.paintRect(
        color,
        brush,
        10,
        10,
        10,
        10,
      )

      paintBuffer.paintRect(
        color,
        brush,
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
      const brush = makeTestPaintRect(1, 1)

      // Tile (0,0)
      paintBuffer.paintRect(
        color,
        brush,
        10,
        10,
        10,
        10,
      )

      // // Tile (1,1) because size is 16
      paintBuffer.paintRect(
        color,
        brush,
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
})
