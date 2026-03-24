import type { IPixelData } from '../_types'
import { type HistoryAction, HistoryManager } from './HistoryManager'
import { PixelAccumulator } from './PixelAccumulator'
import { PixelEngineConfig } from './PixelEngineConfig'
import { applyPatchTiles, type PixelPatchTiles } from './PixelPatchTiles'

export interface PixelWriterOptions {
  maxHistorySteps?: number
  tileSize?: number
  historyManager?: HistoryManager
}

/**
 * @example
 * const targ = new PixelData(new ImageData(10, 10))
 * const writer = new PixelWriter(targ, (writer) => {
 *   return {
 *     ...mutatorApplyMask(writer),
 *     ...mutatorBlendPixelData(writer),
 *     ...mutatorBlendColor(writer),
 *     ...mutatorBlendPixel(writer),
 *     ...mutatorFill(writer),
 *   }
 * })
 *
 * // to import all mutator functions
 * const writer = new PixelWriter(targ, makeFullPixelMutator)
 *
 * writer.withHistory((mutator) => {
 *   mutator.applyMask()
 *   mutator.blendPixelData()
 * })
 */
export class PixelWriter<M> {
  public target: IPixelData
  public historyManager: HistoryManager
  public accumulator: PixelAccumulator
  protected config: PixelEngineConfig
  readonly mutator: M

  constructor(target: IPixelData, mutatorFactory: (writer: PixelWriter<any>) => M, {
    tileSize = 256,
    maxHistorySteps = 50,
    historyManager = new HistoryManager(maxHistorySteps),
  }: PixelWriterOptions = {}) {
    this.target = target
    this.config = new PixelEngineConfig(tileSize)
    this.historyManager = historyManager
    this.accumulator = new PixelAccumulator(target, this.config)
    this.mutator = mutatorFactory(this)
  }

  withHistory(cb: (mutator: M) => void) {
    cb(this.mutator)

    this.captureHistory()
  }

  captureHistory() {
    const beforeTiles = this.accumulator.beforeTiles
    if (beforeTiles.length === 0) return

    const afterTiles = this.accumulator.extractAfterTiles()

    const patch: PixelPatchTiles = {
      beforeTiles: beforeTiles,
      afterTiles: afterTiles,
    }

    const target = this.target
    const tileSize = this.config.tileSize
    const accumulator = this.accumulator

    const action: HistoryAction = {
      undo: () => applyPatchTiles(target, patch.beforeTiles, tileSize),
      redo: () => applyPatchTiles(target, patch.afterTiles, tileSize),
      dispose: () => accumulator.recyclePatch(patch),
    }

    this.historyManager.commit(action)
    this.accumulator.reset()
  }
}
