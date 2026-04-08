import { sourceOverPerfect } from '@/BlendModes/blend-modes-perfect'
import { makeAlphaMaskPaintBufferCommitter } from '@/Paint/Commit/AlphaMaskPaintBufferCommitter'
import * as Commit from '@/Paint/Commit/commitMaskPaintBuffer'
import * as AlphaModule from '@/PixelData/blendColorPixelDataAlphaMask'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { pack } from '../../../_helpers'

describe('makeAlphaMaskPaintBufferCommitter', () => {
  describe('blendColorPixelDataMask', () => {
    beforeEach(() => {
      vi.spyOn(AlphaModule, 'blendColorPixelDataAlphaMask')
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

      const commit = makeAlphaMaskPaintBufferCommitter(
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
        AlphaModule.blendColorPixelDataAlphaMask,
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

      const commit = makeAlphaMaskPaintBufferCommitter(
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
        AlphaModule.blendColorPixelDataAlphaMask,
      )
    })
  })
})

