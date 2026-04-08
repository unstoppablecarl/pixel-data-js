import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as BinaryMaskPaintBufferModule from '@/Paint/BinaryMaskPaintBuffer'
import * as CommitterModule from '@/Paint/Commit/BinaryMaskPaintBufferCommitter'
import { makeBinaryMaskPaintBufferManager } from '@/Paint/Commit/BinaryMaskPaintBufferManager'
import { makeBinaryMaskTile } from '@/Tile/MaskTile'
import * as TilePoolModule from '@/Tile/TilePool'

describe('makeBinaryMaskPaintBufferManager', () => {
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
      paintRect: vi.fn(),
    }

    const poolSpy = vi.spyOn(TilePoolModule, 'TilePool').mockImplementation(() => mockPoolInstance as any)

    const bufferSpy = vi.spyOn(BinaryMaskPaintBufferModule, 'BinaryMaskPaintBuffer').mockImplementation(() => mockBufferInstance as any)

    const committerSpy = vi.spyOn(CommitterModule, 'makeBinaryMaskPaintBufferCommitter').mockReturnValue(mockCommitFn)

    const manager = makeBinaryMaskPaintBufferManager(writer)

    expect(poolSpy).toHaveBeenCalledTimes(1)

    expect(poolSpy).toHaveBeenCalledWith(config, makeBinaryMaskTile)

    expect(bufferSpy).toHaveBeenCalledTimes(1)

    expect(bufferSpy).toHaveBeenCalledWith(config, mockPoolInstance)

    expect(committerSpy).toHaveBeenCalledTimes(1)

    expect(committerSpy).toHaveBeenCalledWith(accumulator, mockBufferInstance)

    expect(manager.commit).toBe(mockCommitFn)

    expect(typeof manager.paintRect).toBe('function')

    expect(typeof manager.paintBinaryMask).toBe('function')

    expect(typeof manager.paintBinaryMask).toBe('function')
  })
})
