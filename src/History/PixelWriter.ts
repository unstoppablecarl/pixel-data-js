import { resizeImageData } from '../ImageData/resizeImageData'
import type { PixelData } from '../PixelData/_pixelData-types'
import { setPixelData } from '../PixelData/PixelData'
import type { PixelTile } from '../Tile/_tile-types'
import { makePixelTile } from '../Tile/PixelTile'
import { TilePool } from '../Tile/TilePool'
import { type HistoryActionFactory, makeHistoryAction } from './HistoryAction'
import { HistoryManager } from './HistoryManager'
import { PixelAccumulator } from './PixelAccumulator'
import { PixelEngineConfig } from './PixelEngineConfig'

export interface PixelWriterOptions {
  maxHistorySteps?: number
  tileSize?: number
  historyManager?: HistoryManager
  historyActionFactory?: HistoryActionFactory
  pixelTilePool?: TilePool<PixelTile>,
  accumulator?: PixelAccumulator
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
  readonly pixelTilePool: TilePool<PixelTile>
  readonly mutator: M

  private _inProgress = false

  constructor(target: PixelData, mutatorFactory: (writer: PixelWriter<any>) => M, options?: PixelWriterOptions) {
    const tileSize = options?.tileSize ?? 256
    const maxHistorySteps = options?.maxHistorySteps ?? 50

    this.config = new PixelEngineConfig(tileSize, target)
    this.historyManager = options?.historyManager ?? new HistoryManager(maxHistorySteps)
    this.historyActionFactory = options?.historyActionFactory ?? makeHistoryAction
    this.pixelTilePool = options?.pixelTilePool ?? new TilePool(this.config, makePixelTile)
    this.accumulator = options?.accumulator ?? new PixelAccumulator(this.config, this.pixelTilePool)
    this.mutator = mutatorFactory(this)
  }

  /**
   * Executes `transaction` and commits the resulting pixel changes as a single
   * undoable history action.
   *
   * - If `transaction` throws, all accumulated changes are rolled back and the error
   *   is re-thrown. No action is committed.
   * - If `transaction` completes without modifying any pixels, no action is committed.
   * - `withHistory` is not re-entrant. Calling it again from inside `transaction` will
   *   throw immediately to prevent silent data loss from a nested extractPatch.
   *
   * @param transaction Callback to be executed inside the transaction.
   * @param after    Called after both undo and redo — use for generic change notifications.
   * @param afterUndo Called after undo only — use for dimension or state changes specific to undo.
   * @param afterRedo Called after redo only.
   */
  withHistory(
    transaction: (mutator: M) => void,
    after?: () => void,
    afterUndo?: () => void,
    afterRedo?: () => void,
  ): void {
    if (this._inProgress) {
      throw new Error('withHistory is not re-entrant — commit or rollback the current operation first')
    }

    this._inProgress = true

    try {
      transaction(this.mutator)
    } catch (e) {
      this.accumulator.rollbackAfterError()
      throw e
    } finally {
      this._inProgress = false
    }

    if (this.accumulator.beforeTiles.length === 0) return

    const patch = this.accumulator.extractPatch()
    const action = this.historyActionFactory(this.config, this.accumulator, patch, after, afterUndo, afterRedo)

    this.historyManager.commit(action)
  }

  resize(
    newWidth: number,
    newHeight: number,
    offsetX = 0,
    offsetY = 0,
    after?: (target: ImageData) => void,
    afterUndo?: (target: ImageData) => void,
    afterRedo?: (target: ImageData) => void,
    resizeImageDataFn = resizeImageData,
  ): void {
    if (this._inProgress) {
      throw new Error('Cannot resize inside a withHistory callback')
    }

    if (this.accumulator.beforeTiles.length > 0) {
      throw new Error('Cannot resize with an open accumulator — commit or rollback first')
    }

    const config = this.config
    const target = config.target
    const beforeImageData = target.imageData
    const afterImageData = resizeImageDataFn(beforeImageData, newWidth, newHeight, offsetX, offsetY)

    setPixelData(target, afterImageData)

    this.historyManager.commit({
      undo: () => {
        setPixelData(target, beforeImageData)
        afterUndo?.(beforeImageData)
        after?.(beforeImageData)
      },
      redo: () => {
        setPixelData(target, afterImageData)
        afterRedo?.(afterImageData)
        after?.(afterImageData)
      },
    })
  }
}

export type HistoryMutator<T extends {}, D extends {}> = (writer: PixelWriter<any>, deps?: Partial<D>) => T

