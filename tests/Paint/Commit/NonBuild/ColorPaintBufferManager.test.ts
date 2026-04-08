import * as ColorPaintBufferModule from '@/Paint/ColorPaintBuffer'
import * as CommitterModule from '@/Paint/Commit/ColorPaintBufferCommitter'
import { makeColorPaintBufferManager } from '@/Paint/Commit/ColorPaintBufferManager'
import { makePixelTile } from '@/Tile/PixelTile'
import * as TilePoolModule from '@/Tile/TilePool'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('makeColorPaintBufferManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('instantiates dependencies and returns the bound api', () => {
    const config = {
      test: 'config',
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
      paintAlphaMask: vi.fn(),
      paintRect: vi.fn(),
    }

    const poolSpy = vi.spyOn(TilePoolModule, 'TilePool').mockImplementation(() => mockPoolInstance as any)

    const bufferSpy = vi.spyOn(ColorPaintBufferModule, 'ColorPaintBuffer').mockImplementation(() => mockBufferInstance as any)

    const committerSpy = vi.spyOn(CommitterModule, 'makeColorPaintBufferCommitter').mockReturnValue(mockCommitFn)

    const manager = makeColorPaintBufferManager(writer)

    expect(poolSpy).toHaveBeenCalledTimes(1)

    expect(poolSpy).toHaveBeenCalledWith(config, makePixelTile)

    expect(bufferSpy).toHaveBeenCalledTimes(1)

    expect(bufferSpy).toHaveBeenCalledWith(config, mockPoolInstance)

    expect(committerSpy).toHaveBeenCalledTimes(1)

    expect(committerSpy).toHaveBeenCalledWith(accumulator, mockBufferInstance)

    expect(manager.commit).toBe(mockCommitFn)

    expect(typeof manager.paintRect).toBe('function')
    expect(typeof manager.paintAlphaMask).toBe('function')
    expect(typeof manager.paintBinaryMask).toBe('function')
  })
})
