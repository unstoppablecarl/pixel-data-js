import { sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import { makeColorPaintBufferCommitter } from '@/Paint/Commit/ColorPaintBufferCommitter'
import * as Commit from '@/Paint/Commit/commitColorPaintBuffer'
import * as BlendModule from '@/PixelData/blendPixelData'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pack } from '../../../_helpers'

describe('makeColorPaintBufferCommitter', () => {
  beforeEach(() => {
    vi.spyOn(BlendModule, 'blendPixelData')
    vi.spyOn(Commit, 'commitColorPaintBuffer')
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

    const commit = makeColorPaintBufferCommitter(
      mockAccumulator,
      mockBuffer,
    )

    commit()

    expect(Commit.commitColorPaintBuffer).toHaveBeenCalledExactlyOnceWith(
      mockAccumulator,
      mockBuffer,
      255,
      sourceOverPerfect,
      BlendModule.blendPixelData,
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

    const commit = makeColorPaintBufferCommitter(
      mockAccumulator,
      mockBuffer,
    )

    commit(customAlpha, customBlendFn)

    expect(Commit.commitColorPaintBuffer).toHaveBeenCalledExactlyOnceWith(
      mockAccumulator,
      mockBuffer,
      customAlpha,
      customBlendFn,
      BlendModule.blendPixelData,
    )
  })
})

