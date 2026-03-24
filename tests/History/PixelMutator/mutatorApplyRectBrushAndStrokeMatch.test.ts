import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mutatorApplyRectBrush, mutatorApplyRectBrushStroke } from '@/index'
import { comparePixelBuffers, pack } from '../../_helpers'
import { mockAccumulatorMutator } from './_helpers'

describe('mutatorApplyRectBrushStroke vs mutatorApplyRectBrush', () => {
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

    // 1. Setup the Single Stamp State
    const stampCtx = mockAccumulatorMutator(mutatorApplyRectBrush)
    stampCtx.mutator.applyRectBrush(
      color,
      x,
      y,
      size,
      size,
      alpha,
      fallOff,
    )

    // 2. Setup the Stroke State
    const strokeCtx = mockAccumulatorMutator(mutatorApplyRectBrushStroke)
    strokeCtx.mutator.applyRectBrushStroke(
      color,
      x,
      y,
      x,
      y,
      size,
      size,
      alpha,
      fallOff,
    )

    // Compare the underlying pixel buffers
    const stampPixels = stampCtx.target.data32
    const strokePixels = strokeCtx.target.data32

    const mismatches = comparePixelBuffers(strokePixels, stampPixels, stampCtx.target.width)

    expect(mismatches).toEqual([])
  })
})
