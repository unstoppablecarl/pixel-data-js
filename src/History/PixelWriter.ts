import { sourceOverPerfect } from '../BlendModes/blend-modes-perfect'
import { resizeImageData } from '../ImageData/resizeImageData'
import { PaintBuffer } from '../Paint/PaintBuffer'
import { blendPixelData } from '../PixelData/blendPixelData'
import type { PixelData } from '../PixelData/PixelData'
import { PixelTilePool } from '../PixelTile/PixelTilePool'
import { type HistoryActionFactory, makeHistoryAction } from './HistoryAction'
import { HistoryManager } from './HistoryManager'
import { PixelAccumulator } from './PixelAccumulator'
import { PixelEngineConfig } from './PixelEngineConfig'

export interface PixelWriterOptions {
  maxHistorySteps?: number
  tileSize?: number
  historyManager?: HistoryManager
  historyActionFactory?: HistoryActionFactory
  pixelTilePool?: PixelTilePool,
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
  readonly pixelTilePool: PixelTilePool
  readonly paintBuffer: PaintBuffer
  readonly mutator: M

  private blendPixelDataOpts = {
    alpha: 255,
    blendFn: sourceOverPerfect,
    x: 0,
    y: 0,
    w: 0,
    h: 0,
  }

  private _inProgress = false

  constructor(target: PixelData, mutatorFactory: (writer: PixelWriter<any>) => M, {
    tileSize = 256,
    maxHistorySteps = 50,
    historyManager = new HistoryManager(maxHistorySteps),
    historyActionFactory = makeHistoryAction,
    pixelTilePool,
    accumulator,
  }: PixelWriterOptions = {}) {
    this.config = new PixelEngineConfig(tileSize, target)
    this.historyManager = historyManager
    this.pixelTilePool = pixelTilePool ?? new PixelTilePool(this.config)
    this.accumulator = accumulator ?? new PixelAccumulator(this.config, this.pixelTilePool)
    this.historyActionFactory = historyActionFactory
    this.mutator = mutatorFactory(this)
    this.paintBuffer = new PaintBuffer(this.config, this.pixelTilePool)
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
    const action = this.historyActionFactory(this, patch, after, afterUndo, afterRedo)

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

    target.set(afterImageData)

    this.historyManager.commit({
      undo: () => {
        target.set(beforeImageData)
        afterUndo?.(beforeImageData)
        after?.(beforeImageData)
      },
      redo: () => {
        target.set(afterImageData)
        afterRedo?.(afterImageData)
        after?.(afterImageData)
      },
    })
  }

  commitPaintBuffer(
    alpha = 255,
    blendFn = sourceOverPerfect,
    blendPixelDataFn = blendPixelData,
  ) {
    const paintBuffer = this.paintBuffer
    const tileShift = paintBuffer.config.tileShift
    const lookup = paintBuffer.lookup

    const opts = this.blendPixelDataOpts

    opts.alpha = alpha
    opts.blendFn = blendFn

    for (let i = 0; i < lookup.length; i++) {
      const tile = lookup[i]

      if (tile) {
        const didChange = this.accumulator.storeTileBeforeState(tile.id, tile.tx, tile.ty)

        const dx = tile.tx << tileShift
        const dy = tile.ty << tileShift

        opts.x = dx
        opts.y = dy
        opts.w = tile.width
        opts.h = tile.height

        didChange(
          blendPixelDataFn(
            this.config.target,
            tile,
            opts,
          ),
        )
      }
    }

    paintBuffer.clear()
  }
}
