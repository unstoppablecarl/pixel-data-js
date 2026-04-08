import { sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import { makeBinaryMaskPaintBufferCommitter } from '@/Paint/Commit/BinaryMaskPaintBufferCommitter'
import * as Commit from '@/Paint/Commit/commitMaskPaintBuffer'
import * as BinaryModule from '@/PixelData/blendColorPixelDataBinaryMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pack } from '../../../_helpers'

describe('makeBinaryMaskPaintBufferCommitter', () => {
  beforeEach(() => {
    vi.spyOn(BinaryModule, 'blendColorPixelDataBinaryMask')
    vi.spyOn(Commit, 'commitMaskPaintBuffer')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const color = pack(255, 0, 255, 255)

  it('calls the commit function with default arguments when omitted', () => {
    const mockBuffer = {
      lookup: [],
      clear: vi.fn(),
    } as any

    const mockAccumulator = {
      config: {},
    } as any

    const commit = makeBinaryMaskPaintBufferCommitter(
      mockAccumulator,
      mockBuffer,
    )

    commit(color)

    expect(Commit.commitMaskPaintBuffer).toHaveBeenCalledExactlyOnceWith(
      mockAccumulator,
      mockBuffer,
      color,
      255,
      sourceOverPerfect,
      BinaryModule.blendColorPixelDataBinaryMask,
    )

    expect(mockBuffer.clear).toHaveBeenCalledOnce()
  })

  it('calls the commit function with explicit alpha and blend mode', () => {
    const mockBuffer = {
      lookup: [],
      clear: vi.fn(),
    } as any

    const mockAccumulator = {
      config: {},
    } as any

    const customAlpha = 128
    const customBlendFn = vi.fn()

    const commit = makeBinaryMaskPaintBufferCommitter(
      mockAccumulator,
      mockBuffer,
    )

    commit(color, customAlpha, customBlendFn)

    expect(Commit.commitMaskPaintBuffer).toHaveBeenCalledExactlyOnceWith(
      mockAccumulator,
      mockBuffer,
      color,
      customAlpha,
      customBlendFn,
      BinaryModule.blendColorPixelDataBinaryMask,
    )
  })
})

