import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeCircleBrushAlphaMask, mutatorApplyCircleBrush, mutatorApplyCircleBrushStroke } from '@/index'
import { comparePixelBuffers, pack } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyCircleBrushStroke vs mutatorApplyCircleBrush', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('produces identical pixel output for a zero-length stroke vs a single stamp', async () => {
    const color = pack(255, 128, 64, 255)
    const x = 20.7
    const y = 20.2
    const size = 7
    const alpha = 180
    const fallOff = (d: number) => 1 - (d * d)
    const brush = makeCircleBrushAlphaMask(size, fallOff)

    // 1. Setup the Single Stamp State
    const stampCtx = mockAccumulatorMutator(mutatorApplyCircleBrush)
    stampCtx.mutator.applyCircleBrush(
      color,
      x,
      y,
      brush,
      alpha,
    )

    // 2. Setup the Stroke State
    const strokeCtx = mockAccumulatorMutator(mutatorApplyCircleBrushStroke)
    strokeCtx.mutator.applyCircleBrushStroke(
      color,
      x,
      y,
      x, // Same start/end
      y,
      brush,
      alpha,
    )

    // Compare the underlying pixel buffers
    const stampPixels = stampCtx.target.data32
    const strokePixels = strokeCtx.target.data32

    const mismatches = comparePixelBuffers(strokePixels, stampPixels, stampCtx.target.width)

    expect(mismatches).toEqual([])
  })
})
