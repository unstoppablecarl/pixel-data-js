import {
  blendPixelDataPaintBuffer,
  type ColorPaintBuffer,
  makePixelTile,
  type PixelData32,
  type PixelTile,
} from '@/index'
import { describe, expect, it, vi } from 'vitest'

describe('blendPixelDataPaintBuffer', () => {
  it('does not call the blend function if the lookup array is empty', () => {
    const mockPaintBuffer = {
      config: {
        tileShift: 8,
      },
      lookup: [],
    } as unknown as ColorPaintBuffer

    const mockTarget = {} as PixelData32
    const mockBlend = vi.fn()

    blendPixelDataPaintBuffer(mockTarget, mockPaintBuffer, 255, undefined, mockBlend)

    expect(mockBlend).not.toHaveBeenCalled()
  })

  it('skips empty slots and calculates correct bitwise coordinates with default options', () => {
    const tileSize = 256
    const tileA = makePixelTile(98, 1, 2, tileSize, tileSize * tileSize)
    const tileC = makePixelTile(99, 3, 0, tileSize, tileSize * tileSize)

    const mockPaintBuffer = {
      config: {
      },
      lookup: [
        tileA,
        undefined,
        tileC,
      ],
    } as unknown as ColorPaintBuffer

    const mockTarget = {} as PixelData32

    // We must clone the opts parameter inside the mock to capture
    // its state before the next iteration mutates it.
    const capturedCalls: any[] = []

    const mockBlend = vi.fn((target, tile, opts) => {
      capturedCalls.push({
        target,
        tile,
        opts: { ...opts },
      })
    }) as any

    blendPixelDataPaintBuffer(mockTarget, mockPaintBuffer, undefined, undefined, mockBlend)

    expect(mockBlend).toHaveBeenCalledTimes(2)

    // Verify Tile A: tx=1 (1 << 8 = 256), ty=2 (2 << 8 = 512)
    expect(capturedCalls[0].tile).toBe(tileA)
    expect(capturedCalls[0].opts.x).toBe(256)
    expect(capturedCalls[0].opts.y).toBe(512)
    expect(capturedCalls[0].opts.alpha).toBe(255)
    expect(capturedCalls[0].opts.blendFn).toBeUndefined()

    // Verify Tile C: tx=3 (3 << 8 = 768), ty=0 (0 << 8 = 0)
    expect(capturedCalls[1].tile).toBe(tileC)
    expect(capturedCalls[1].opts.x).toBe(768)
    expect(capturedCalls[1].opts.y).toBe(0)
  })

  it('passes custom alpha and blend function correctly', () => {
    const tileA = {
      tx: 0,
      ty: 0,
    } as PixelTile

    const mockPaintBuffer = {
      config: {
        tileShift: 4,
      },
      lookup: [
        tileA,
      ],
    } as unknown as ColorPaintBuffer

    const mockTarget = {} as PixelData32
    const mockCustomBlendMode = vi.fn() as any

    const capturedCalls: any[] = []

    const mockBlend = vi.fn((target, tile, opts) => {
      capturedCalls.push({
        opts: { ...opts },
      })
    }) as any

    blendPixelDataPaintBuffer(mockTarget, mockPaintBuffer, 128, mockCustomBlendMode, mockBlend)

    expect(mockBlend).toHaveBeenCalledTimes(1)
    expect(capturedCalls[0].opts.alpha).toBe(128)
    expect(capturedCalls[0].opts.blendFn).toBe(mockCustomBlendMode)
  })
})
