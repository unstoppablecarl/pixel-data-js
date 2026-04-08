import {
  blendPixelData,
  type Color32,
  ColorPaintBuffer,
  commitColorPaintBuffer,
  MaskType,
  type PixelAccumulator,
  type PixelEngineConfig,
  TileType,
} from '@/index'
import { describe, expect, it, vi } from 'vitest'
import { makeTestPixelData } from '../../_helpers'

describe('commitColorPaintBuffer', () => {

  it('commit', () => {
    const config = {
      target: makeTestPixelData(100, 100),
      tileShift: 4,
      tileMask: 15,
      tileSize: 16,
      tileArea: 256,
    } as unknown as PixelEngineConfig

    const didChange = vi.fn()
    const accumulator = {
      config: config,
      storeTileBeforeState: vi.fn().mockReturnValue(didChange),
    } as unknown as PixelAccumulator

    const tile1 = {
      type: MaskType.BINARY,
      tileType: TileType.MASK,
      data: new Uint8Array(256),
      id: 1,
      tx: 0,
      ty: 0,
      w: 16,
      h: 16,
    }

    const tile2 = {
      type: MaskType.BINARY,
      tileType: TileType.MASK,
      data: new Uint8Array(256),
      id: 2,
      tx: 1,
      ty: 0,
      w: 16,
      h: 16,
    }

    const buffer = {
      clear: vi.fn(),
      lookup: [tile1, undefined, tile2],
    } as unknown as ColorPaintBuffer
    const color = 0xff0000ff as Color32
    const alpha = 128
    const mockBlendFn = vi.fn()

    const blendPixelDataFn = vi.fn().mockReturnValue(true) as unknown as typeof blendPixelData

    commitColorPaintBuffer(accumulator, buffer, alpha, mockBlendFn, blendPixelDataFn)

    expect(accumulator.storeTileBeforeState).toHaveBeenCalledTimes(2)
    expect(accumulator.storeTileBeforeState).toHaveBeenCalledWith(tile1.id, tile1.tx, tile1.ty)
    expect(accumulator.storeTileBeforeState).toHaveBeenCalledWith(tile2.id, tile2.tx, tile2.ty)

    expect(blendPixelDataFn).toHaveBeenCalledTimes(2)
    expect(blendPixelDataFn).toHaveBeenCalledWith(config.target, tile1, expect.objectContaining({
      alpha,
      blendFn: mockBlendFn,
      w: tile1.w,
      h: tile1.h,
    }))

    expect(blendPixelDataFn).toHaveBeenCalledWith(config.target, tile2, expect.objectContaining({
      alpha,
      blendFn: mockBlendFn,
      w: tile2.w,
      h: tile2.h,
    }))

    expect(didChange.mock.calls).toEqual([
      [true],
      [true],
    ])
    expect(buffer.clear).toHaveBeenCalledOnce()
  })
})
