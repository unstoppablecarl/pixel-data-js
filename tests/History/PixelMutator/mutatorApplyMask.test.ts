import { applyAlphaMaskToPixelData, applyBinaryMaskToPixelData, mutatorApplyMask } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestAlphaMask, makeTestBinaryMask } from '../../_helpers'
import { mockMutator } from './_helpers'

describe('mutatorApplyMask', () => {
  const {
    mutator,
    accumulator,
    target,
    spyDeps,
    reset,
  } = mockMutator(mutatorApplyMask, { applyAlphaMaskToPixelData, applyBinaryMaskToPixelData }, 32, 32)

  beforeEach(() => {
    vi.resetAllMocks()
    reset()
  })

  it('should call accumulator for Binary', () => {
    const mask = makeTestBinaryMask(4, 4, 1)

    const x = 5
    const y = 6

    const opts = {
      x,
      y,
      w: 4,
      h: 4,
      mx: 1,
      my: 2,
      alpha: 111,
      invertMask: true,
    };

    (spyDeps.applyBinaryMaskToPixelData as any).mockReturnValue(true)

    const result = mutator.applyMask(mask, opts)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledWith(
      x,
      y,
      opts.w,
      opts.h,
    )

    expect(spyDeps.applyBinaryMaskToPixelData).toHaveBeenCalledWith(
      target,
      mask,
      expect.objectContaining(opts),
    )

    expect(spyDeps.applyAlphaMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call accumulator with defaults for Binary', () => {
    const mask = makeTestBinaryMask(4, 4, 1);

    (spyDeps.applyBinaryMaskToPixelData as any).mockReturnValue(true)

    const result = mutator.applyMask(mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      0,
      0,
      target.w,
      target.h,
    )

    expect(spyDeps.applyBinaryMaskToPixelData).toHaveBeenCalledExactlyOnceWith(
      target,
      mask,
      undefined,
    )

    expect(spyDeps.applyAlphaMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call accumulator for Alpha', () => {
    const mask = makeTestAlphaMask(4, 4, 1)

    const x = 5
    const y = 6

    const opts = {
      x,
      y,
      w: 4,
      h: 4,
      mx: 1,
      my: 2,
      alpha: 111,
      invertMask: true,
    };

    (spyDeps.applyAlphaMaskToPixelData as any).mockReturnValue(true)

    const result = mutator.applyMask(mask, opts)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      x,
      y,
      opts.w,
      opts.h,
    )

    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledExactlyOnceWith(
      target,
      mask,
      expect.objectContaining(opts),
    )

    expect(spyDeps.applyBinaryMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should call accumulator with defaults for Alpha', () => {
    const mask = makeTestAlphaMask(4, 4, 1);

    (spyDeps.applyAlphaMaskToPixelData as any).mockReturnValue(true)

    const result = mutator.applyMask(mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      0,
      0,
      target.w,
      target.h,
    )

    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledExactlyOnceWith(
      target,
      mask,
      undefined,
    )

    expect(spyDeps.applyBinaryMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should return false for out of bounds result', () => {
    const mask = makeTestAlphaMask(4, 4, 1);

    (spyDeps.applyAlphaMaskToPixelData as any).mockReturnValue(true)

    const result = mutator.applyMask(mask)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      0,
      0,
      target.w,
      target.h,
    )

    expect(spyDeps.applyAlphaMaskToPixelData).toHaveBeenCalledExactlyOnceWith(
      target,
      mask,
      undefined,
    )

    expect(spyDeps.applyBinaryMaskToPixelData).not.toHaveBeenCalled()
    expect(result).toBe(true)
  })

  it('should return false when input is out of bounds', () => {
    const mask = makeTestAlphaMask(4, 4, 1)

    const x = 5000
    const y = 6000

    const opts = {
      x,
      y,
      w: 4,
      h: 4,
      mx: 1,
      my: 2,
      alpha: 111,
      invertMask: true,
    };

    (spyDeps.applyAlphaMaskToPixelData as any).mockReturnValue(true)

    const result = mutator.applyMask(mask, opts)
    expect(result).toBe(false)

    expect(accumulator.storeRegionBeforeState).toHaveBeenCalledExactlyOnceWith(
      x,
      y,
      opts.w,
      opts.h,
    )

    expect(spyDeps.applyAlphaMaskToPixelData).not.toHaveBeenCalled()

    expect(spyDeps.applyBinaryMaskToPixelData).not.toHaveBeenCalled()
  })
})
