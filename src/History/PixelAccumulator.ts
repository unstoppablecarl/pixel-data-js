import { type PixelTile } from '../PixelTile/PixelTile'
import type { PixelTilePool } from '../PixelTile/PixelTilePool'
import type { PixelEngineConfig } from './PixelEngineConfig'
import { applyPatchTiles, type PixelPatchTiles } from './PixelPatchTiles'

export type DidChangeFn = (didChange: boolean) => boolean

export class PixelAccumulator {
  public lookup: (PixelTile | undefined)[]
  public beforeTiles: PixelTile[]

  constructor(
    readonly config: PixelEngineConfig,
    readonly tilePool: PixelTilePool,
  ) {
    this.lookup = []
    this.beforeTiles = []
  }

  recyclePatch(patch: PixelPatchTiles) {
    this.tilePool.releaseTiles(patch.beforeTiles)
    this.tilePool.releaseTiles(patch.afterTiles)
  }

  /**
   * @param x pixel x coordinate
   * @param y pixel y coordinate
   */
  storePixelBeforeState(x: number, y: number): DidChangeFn {
    const shift = this.config.tileShift
    const columns = this.config.targetColumns
    const tx = x >> shift
    const ty = y >> shift
    const id = ty * columns + tx

    let tile = this.lookup[id]
    let added = false

    if (!tile) {
      tile = this.tilePool.getTile(id, tx, ty)

      this.extractState(tile)
      this.lookup[id] = tile
      this.beforeTiles.push(tile)
      added = true
    }

    return (didChange: boolean) => {
      if (!didChange && added) {
        this.beforeTiles.pop()
        this.lookup[id] = undefined
        this.tilePool.releaseTile(tile!)
      }
      return didChange
    }
  }

  /**
   * @param x pixel x coordinate
   * @param y pixel y coordinate
   * @param w pixel width
   * @param h pixel height
   */
  storeRegionBeforeState(
    x: number,
    y: number,
    w: number,
    h: number,
  ): DidChangeFn {
    const shift = this.config.tileShift
    const columns = this.config.targetColumns

    const startX = x >> shift
    const startY = y >> shift
    const endX = (x + w - 1) >> shift
    const endY = (y + h - 1) >> shift

    const startIndex = this.beforeTiles.length

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        const id = ty * columns + tx
        let tile = this.lookup[id]

        if (!tile) {
          tile = this.tilePool.getTile(id, tx, ty)

          this.extractState(tile)
          this.lookup[id] = tile
          this.beforeTiles.push(tile)
        }
      }
    }

    return (didChange: boolean) => {
      if (!didChange) {
        const length = this.beforeTiles.length

        for (let i = startIndex; i < length; i++) {
          let t = this.beforeTiles[i]

          if (t) {
            this.lookup[t.id] = undefined
            this.tilePool.releaseTile(t)
          }
        }

        this.beforeTiles.length = startIndex
      }
      return didChange
    }
  }

  storeTileBeforeState(id: number, tx: number, ty: number): DidChangeFn {
    let tile = this.lookup[id]
    let added = false

    if (!tile) {
      tile = this.tilePool.getTile(id, tx, ty)

      this.extractState(tile)
      this.lookup[id] = tile
      this.beforeTiles.push(tile)
      added = true
    }

    return (didChange: boolean) => {
      if (!didChange && added) {
        this.beforeTiles.pop()
        this.lookup[id] = undefined
        this.tilePool.releaseTile(tile!)
      }
      return didChange
    }
  }

  extractState(tile: PixelTile) {
    const target = this.config.target
    const TILE_SIZE = this.config.tileSize
    const dst = tile.data32
    const src = target.data32
    const startX = tile.tx * TILE_SIZE
    const startY = tile.ty * TILE_SIZE
    const targetWidth = target.width
    const targetHeight = target.height

    // If the tile is completely outside the canvas, zero it out.
    if (startX >= targetWidth || startX + TILE_SIZE <= 0 || startY >= targetHeight || startY + TILE_SIZE <= 0) {
      dst.fill(0)
      return
    }

    // Calculate offset if tile starts off the left side of the screen
    let srcOffsetX = Math.max(0, -startX)
    let copyWidth = Math.max(0, Math.min(TILE_SIZE - srcOffsetX, targetWidth - Math.max(0, startX)))

    for (let ly = 0; ly < TILE_SIZE; ly++) {
      let globalY = startY + ly
      let dstIndex = ly * TILE_SIZE

      // Check negative bounds accurately
      if (globalY < 0 || globalY >= targetHeight || copyWidth === 0) {
        dst.fill(0, dstIndex, dstIndex + TILE_SIZE)
        continue
      }

      let srcIndex = globalY * targetWidth + Math.max(0, startX)
      let rowData = src.subarray(srcIndex, srcIndex + copyWidth)

      // Shift the paste over by the offset
      dst.set(rowData, dstIndex + srcOffsetX)

      // Pad the left edge with 0s if we hung off the left side
      if (srcOffsetX > 0) {
        dst.fill(0, dstIndex, dstIndex + srcOffsetX)
      }

      // Pad the right edge with 0s if we hung off the right side
      if (srcOffsetX + copyWidth < TILE_SIZE) {
        dst.fill(0, dstIndex + srcOffsetX + copyWidth, dstIndex + TILE_SIZE)
      }
    }
  }

  extractPatch(): PixelPatchTiles {
    const afterTiles: PixelTile[] = []
    const length = this.beforeTiles.length

    for (let i = 0; i < length; i++) {
      let beforeTile = this.beforeTiles[i]

      if (beforeTile) {
        let afterTile = this.tilePool.getTile(beforeTile.id, beforeTile.tx, beforeTile.ty)

        this.extractState(afterTile)
        afterTiles.push(afterTile)
      }
    }

    const beforeTiles = this.beforeTiles
    this.beforeTiles = []
    this.lookup.length = 0

    return {
      beforeTiles,
      afterTiles,
    }
  }

  rollbackAfterError() {
    const target = this.config.target
    const tileSize = this.config.tileSize
    const length = this.beforeTiles.length

    applyPatchTiles(target, this.beforeTiles, tileSize)

    for (let i = 0; i < length; i++) {
      let tile = this.beforeTiles[i]

      if (tile) {
        this.lookup[tile.id] = undefined
        this.tilePool.releaseTile(tile)
      }
    }

    this.beforeTiles.length = 0
    this.lookup.length = 0
  }
}
