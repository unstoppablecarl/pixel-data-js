import * as BinaryMaskPaintBufferModule from '@/Paint/BinaryMaskPaintBuffer'
import * as CommitterModule from '@/Paint/Commit/BinaryMaskPaintBufferCommitter'
import { makeBinaryMaskPaintBufferManager } from '@/Paint/Commit/BinaryMaskPaintBufferManager'
import { makeBinaryMaskTile } from '@/Tile/MaskTile'
import * as TilePoolModule from '@/Tile/TilePool'
import { describe, expect, it, vi } from 'vitest'
import { useOffscreenCanvasMock } from '../../../_helpers/OffscreenCanvasMock'

describe('makeBinaryMaskPaintBufferManager', () => {
  it('instantiates dependencies and returns the bound api', () => {
    const config = {
      test: 'config',
      tileSize: 8,
    } as any

    const accumulator = {
      config,
    } as any

    const writer = {
      accumulator,
      config,
    }

    const mockCommitFn = vi.fn()
    const mockPoolInstance = { id: 'mock-pool' }

    const mockBufferInstance = {
      paintBinaryMask: vi.fn(),
      paintRect: vi.fn(),
      config,
      clear: vi.fn(),
    }

    const poolSpy = vi.spyOn(TilePoolModule, 'TilePool').mockImplementation(() => mockPoolInstance as any)
    const bufferSpy = vi.spyOn(BinaryMaskPaintBufferModule, 'BinaryMaskPaintBuffer').mockImplementation(() => mockBufferInstance as any)
    const committerSpy = vi.spyOn(CommitterModule, 'makeBinaryMaskPaintBufferCommitter').mockReturnValue(mockCommitFn)

    const context = {}
    const canvas = {
      getContext: vi.fn().mockReturnValue(context),
    }
    const canvasFactory = vi.fn().mockReturnValue(() => ({
        canvas,
        ctx: context,
      }),
    )

    const manager = makeBinaryMaskPaintBufferManager(writer, canvasFactory)

    expect(poolSpy).toHaveBeenCalledExactlyOnceWith(config.tileSize, makeBinaryMaskTile)
    expect(bufferSpy).toHaveBeenCalledExactlyOnceWith(config, mockPoolInstance)
    expect(committerSpy).toHaveBeenCalledExactlyOnceWith(accumulator, mockBufferInstance)

    expect(manager.commit).toBe(mockCommitFn)

    expect(typeof manager.clear).toBe('function')
    expect(typeof manager.renderer).toBe('object')
    expect(typeof manager.paintRect).toBe('function')
    expect(typeof manager.paintBinaryMask).toBe('function')
    expect(typeof manager.paintBinaryMask).toBe('function')
  })

  it('default (OffscreenCanvas)', () => {
    const config = {
      test: 'config',
      tileSize: 8,
    } as any

    const accumulator = {
      config,
    } as any

    const writer = {
      accumulator,
      config,
    }

    const mockCommitFn = vi.fn()
    const mockPoolInstance = { id: 'mock-pool' }

    const mockBufferInstance = {
      paintBinaryMask: vi.fn(),
      paintRect: vi.fn(),
      config,
      clear: vi.fn(),
    }

    const poolSpy = vi.spyOn(TilePoolModule, 'TilePool').mockImplementation(() => mockPoolInstance as any)
    const bufferSpy = vi.spyOn(BinaryMaskPaintBufferModule, 'BinaryMaskPaintBuffer').mockImplementation(() => mockBufferInstance as any)
    const committerSpy = vi.spyOn(CommitterModule, 'makeBinaryMaskPaintBufferCommitter').mockReturnValue(mockCommitFn)

    useOffscreenCanvasMock()
    const manager = makeBinaryMaskPaintBufferManager(writer)

    expect(poolSpy).toHaveBeenCalledExactlyOnceWith(config.tileSize, makeBinaryMaskTile)
    expect(bufferSpy).toHaveBeenCalledExactlyOnceWith(config, mockPoolInstance)
    expect(committerSpy).toHaveBeenCalledExactlyOnceWith(accumulator, mockBufferInstance)

    expect(manager.commit).toBe(mockCommitFn)

    expect(typeof manager.clear).toBe('function')
    expect(typeof manager.renderer).toBe('object')
    expect(typeof manager.paintRect).toBe('function')
    expect(typeof manager.paintBinaryMask).toBe('function')
    expect(typeof manager.paintBinaryMask).toBe('function')
  })
})
