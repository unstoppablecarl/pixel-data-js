import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as AlphaMaskPaintBufferModule from '@/Paint/AlphaMaskPaintBuffer'
import * as CommitterModule from '@/Paint/Commit/AlphaMaskPaintBufferCommitter'
import { makeAlphaMaskPaintBufferManager } from '@/Paint/Commit/AlphaMaskPaintBufferManager'
import { makeAlphaMaskTile } from '@/Tile/MaskTile'
import * as TilePoolModule from '@/Tile/TilePool'

describe('makeAlphaMaskPaintBufferManager', () => {
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
      paintAlphaMask: vi.fn(),
      paintBinaryMask: vi.fn(),
      paintRect: vi.fn(),
    }

    const poolSpy = vi.spyOn(TilePoolModule, 'TilePool').mockImplementation(() => mockPoolInstance as any)

    const bufferSpy = vi.spyOn(AlphaMaskPaintBufferModule, 'AlphaMaskPaintBuffer').mockImplementation(() => mockBufferInstance as any)

    const committerSpy = vi.spyOn(CommitterModule, 'makeAlphaMaskPaintBufferCommitter').mockReturnValue(mockCommitFn)

    const manager = makeAlphaMaskPaintBufferManager(writer)

    expect(poolSpy).toHaveBeenCalledTimes(1)

    expect(poolSpy).toHaveBeenCalledWith(config, makeAlphaMaskTile)

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
