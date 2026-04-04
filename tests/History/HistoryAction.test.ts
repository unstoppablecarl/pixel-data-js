import { type IPixelData32, makeHistoryAction, PixelAccumulator, PixelEngineConfig } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('makeHistoryAction', () => {
  let target: IPixelData32
  const tileSize = 16
  let config: PixelEngineConfig
  let accumulator: PixelAccumulator

  const mockPatch = {
    beforeTiles: [
      {
        x: 0,
        y: 0,
        data: 'old',
      },
    ],
    afterTiles: [
      {
        x: 0,
        y: 0,
        data: 'new',
      },
    ],
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    target = makeTestPixelData(10, 10)

    config = {
      target,
      tileSize,
    } as any

    accumulator = {
      recyclePatch: vi.fn(),
    } as any
  })

  it('should call applyPatchTiles with beforeTiles and triggers when undo is called', () => {
    const after = vi.fn()
    const afterUndo = vi.fn()
    const applyPatchTiles = vi.fn()
    const action = makeHistoryAction(
      config,
      accumulator,
      mockPatch,
      after,
      afterUndo,
      undefined,
      applyPatchTiles,
    )

    action.undo()

    expect(applyPatchTiles).toHaveBeenCalledWith(
      target,
      mockPatch.beforeTiles,
      tileSize,
    )
    expect(afterUndo).toHaveBeenCalled()
    expect(after).toHaveBeenCalled()
  })

  it('should call applyPatchTiles with afterTiles and triggers when redo is called', () => {
    const after = vi.fn()
    const afterRedo = vi.fn()
    const applyPatchTiles = vi.fn()

    const action = makeHistoryAction(
      config,
      accumulator,
      mockPatch,
      after,
      undefined,
      afterRedo,
      applyPatchTiles,
    )

    action.redo()

    expect(applyPatchTiles).toHaveBeenCalledWith(
      target,
      mockPatch.afterTiles,
      tileSize,
    )
    expect(afterRedo).toHaveBeenCalled()
    expect(after).toHaveBeenCalled()
  })

  it('should recycle the patch when dispose is called', () => {
    const action = makeHistoryAction(
      config,
      accumulator,
      mockPatch,
    )

    action.dispose?.()

    expect(accumulator.recyclePatch).toHaveBeenCalledWith(mockPatch)
  })

  it('should not crash if optional callbacks are omitted', () => {
    const applyPatchTiles = vi.fn()
    const action = makeHistoryAction(
      config,
      accumulator,
      mockPatch,
      undefined,
      undefined,
      undefined,
      applyPatchTiles,
    )

    action.undo()

    expect(() => action.undo()).not.toThrow()
    expect(() => action.redo()).not.toThrow()
  })
})
