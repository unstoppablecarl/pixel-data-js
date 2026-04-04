import type { PixelAccumulator } from './PixelAccumulator'
import type { PixelEngineConfig } from './PixelEngineConfig'
import { applyPatchTiles, type PixelPatchTiles } from './PixelPatchTiles'

export interface HistoryAction {
  undo: () => void
  redo: () => void
  dispose?: () => void
}

export type HistoryActionFactory = typeof makeHistoryAction

export function makeHistoryAction(
  config: PixelEngineConfig,
  accumulator: PixelAccumulator,
  patch: PixelPatchTiles,
  after?: () => void,
  afterUndo?: () => void,
  afterRedo?: () => void,
  applyPatchTilesFn = applyPatchTiles,
): HistoryAction {

  const target = config.target
  const tileSize = config.tileSize

  return {
    undo: () => {
      applyPatchTilesFn(target, patch.beforeTiles, tileSize)
      afterUndo?.()
      after?.()
    },
    redo: () => {
      applyPatchTilesFn(target, patch.afterTiles, tileSize)
      afterRedo?.()
      after?.()
    },
    dispose: () => accumulator.recyclePatch(patch),
  }
}
