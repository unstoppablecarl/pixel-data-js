import { applyPatchTiles as baseApplyPatchTiles, type PixelPatchTiles } from './PixelPatchTiles'
import type { PixelWriter } from './PixelWriter'

export interface HistoryAction {
  undo: () => void
  redo: () => void
  dispose?: () => void
}

export type HistoryActionFactory = typeof makeHistoryAction

export function makeHistoryAction(
  writer: PixelWriter<any>,
  patch: PixelPatchTiles,
  after?: () => void,
  afterUndo?: () => void,
  afterRedo?: () => void,
  applyPatchTiles = baseApplyPatchTiles,
): HistoryAction {

  const target = writer.config.target
  const tileSize = writer.config.tileSize
  const accumulator = writer.accumulator

  return {
    undo: () => {
      applyPatchTiles(target, patch.beforeTiles, tileSize)
      afterUndo?.()
      after?.()
    },
    redo: () => {
      applyPatchTiles(target, patch.afterTiles, tileSize)
      afterRedo?.()
      after?.()
    },
    dispose: () => accumulator.recyclePatch(patch),
  }
}
