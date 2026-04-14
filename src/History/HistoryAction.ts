import type { TileTargetConfig } from '../Tile/_tile-types'
import type { PixelAccumulator } from './PixelAccumulator'
import { applyPatchTiles, type PixelPatchTiles } from './PixelPatchTiles'

export interface HistoryAction {
  undo: () => void
  redo: () => void
  dispose?: () => void
}

export type HistoryActionFactory = typeof makeHistoryAction

export function makeHistoryAction(
  config: TileTargetConfig,
  accumulator: PixelAccumulator,
  patch: PixelPatchTiles,
  afterUndo?: (patch: PixelPatchTiles) => void,
  afterRedo?: (patch: PixelPatchTiles) => void,
  applyPatchTilesFn = applyPatchTiles,
): HistoryAction {

  const target = config.target
  const tileSize = config.tileSize

  return {
    undo: () => {
      applyPatchTilesFn(target, patch.beforeTiles, tileSize)
      afterUndo?.(patch)
    },
    redo: () => {
      applyPatchTilesFn(target, patch.afterTiles, tileSize)
      afterRedo?.(patch)
    },
    dispose: () => accumulator.recyclePatch(patch),
  }
}
