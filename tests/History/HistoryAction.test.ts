import { makeHistoryAction, PixelAccumulator, type PixelData32, PixelEngineConfig } from '@/index'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { makeTestPixelData } from '../_helpers'

describe('makeHistoryAction', () => {
  let target: PixelData32
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
    const afterUndo = vi.fn()
    const applyPatchTiles = vi.fn()
    const action = makeHistoryAction(
      config,
      accumulator,
      mockPatch,
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

    expect(afterUndo).toHaveBeenCalledExactlyOnceWith(mockPatch)
  })

  it('should call applyPatchTiles with afterTiles and triggers when redo is called', () => {
    const afterRedo = vi.fn()
    const applyPatchTiles = vi.fn()

    const action = makeHistoryAction(
      config,
      accumulator,
      mockPatch,
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
    expect(afterRedo).toHaveBeenCalledExactlyOnceWith(mockPatch)
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
      applyPatchTiles,
    )

    action.undo()

    expect(() => action.undo()).not.toThrow()
    expect(() => action.redo()).not.toThrow()
  })
})
