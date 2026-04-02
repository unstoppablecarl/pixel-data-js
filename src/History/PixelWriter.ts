import type { IPixelData } from '../_types'
import { type HistoryActionFactory, makeHistoryAction } from './HistoryAction'
import { HistoryManager } from './HistoryManager'
import { PixelAccumulator } from './PixelAccumulator'
import { PixelEngineConfig } from './PixelEngineConfig'
import { PixelTilePool } from '../PixelTile/PixelTilePool'

export interface PixelWriterOptions {
  maxHistorySteps?: number
  tileSize?: number
  historyManager?: HistoryManager
  historyActionFactory?: HistoryActionFactory
  pixelTilePool?: PixelTilePool,
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
  readonly historyManager: HistoryManager
  readonly accumulator: PixelAccumulator
  readonly historyActionFactory: HistoryActionFactory
  readonly config: PixelEngineConfig
  readonly mutator: M

  constructor(target: IPixelData, mutatorFactory: (writer: PixelWriter<any>) => M, {
    tileSize = 256,
    maxHistorySteps = 50,
    historyManager = new HistoryManager(maxHistorySteps),
    historyActionFactory = makeHistoryAction,
    pixelTilePool,
  }: PixelWriterOptions = {}) {
    this.config = new PixelEngineConfig(tileSize, target)
    this.historyManager = historyManager
    pixelTilePool ??= new PixelTilePool(this.config)
    this.accumulator = new PixelAccumulator(this.config, pixelTilePool)
    this.historyActionFactory = historyActionFactory
    this.mutator = mutatorFactory(this)
  }

  withHistory(
    cb: (mutator: M) => void,
    after?: () => void,
    afterUndo?: () => void,
    afterRedo?: () => void,
  ) {
    try {
      cb(this.mutator)
    } catch (e) {
      this.accumulator.rollback()
      throw e
    }

    if (this.accumulator.beforeTiles.length === 0) return

    const patch = this.accumulator.extractPatch()
    const action = this.historyActionFactory(this, patch, after, afterUndo, afterRedo)

    this.historyManager.commit(action)
  }
}
