import { PixelTile } from '../PixelTile/PixelTile'
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
    let shift = this.config.tileShift
    let columns = this.config.targetColumns
    let tx = x >> shift
    let ty = y >> shift
    let id = ty * columns + tx

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
    let shift = this.config.tileShift
    let columns = this.config.targetColumns

    let startX = x >> shift
    let startY = y >> shift
    let endX = (x + w - 1) >> shift
    let endY = (y + h - 1) >> shift

    let startIndex = this.beforeTiles.length

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        let id = ty * columns + tx
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
        let length = this.beforeTiles.length

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

  extractState(tile: PixelTile) {
    let target = this.config.target
    let TILE_SIZE = this.config.tileSize
    let dst = tile.data32
    let src = target.data32
    let startX = tile.tx * TILE_SIZE
    let startY = tile.ty * TILE_SIZE
    let targetWidth = target.width
    let targetHeight = target.height

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
    let afterTiles: PixelTile[] = []
    let length = this.beforeTiles.length

    for (let i = 0; i < length; i++) {
      let beforeTile = this.beforeTiles[i]

      if (beforeTile) {
        let afterTile = this.tilePool.getTile(beforeTile.id, beforeTile.tx, beforeTile.ty)

        this.extractState(afterTile)
        afterTiles.push(afterTile)
      }
    }

    let beforeTiles = this.beforeTiles
    this.beforeTiles = []
    this.lookup.length = 0

    return {
      beforeTiles,
      afterTiles,
    }
  }

  rollback() {
    let target = this.config.target
    let tileSize = this.config.tileSize
    let length = this.beforeTiles.length

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
