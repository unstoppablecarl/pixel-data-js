import type { PixelTile } from '../Tile/_tile-types'
import type { TilePool } from '../Tile/TilePool'
import type { PixelEngineConfig } from './PixelEngineConfig'
import { applyPatchTiles, type PixelPatchTiles } from './PixelPatchTiles'

export type DidChangeFn = (didChange: boolean) => boolean

export class PixelAccumulator {
  public lookup: (PixelTile | undefined)[]
  public beforeTiles: PixelTile[]

  constructor(
    readonly config: PixelEngineConfig,
    readonly pixelTilePool: TilePool<PixelTile>,
  ) {
    this.lookup = []
    this.beforeTiles = []
  }

  recyclePatch(patch: PixelPatchTiles) {
    this.pixelTilePool.releaseTiles(patch.beforeTiles)
    this.pixelTilePool.releaseTiles(patch.afterTiles)
  }

  /**
   * @param x pixel x coordinate
   * @param y pixel y coordinate
   */
  storePixelBeforeState(x: number, y: number): DidChangeFn | null {
    const shift = this.config.tileShift
    const columns = this.config.targetColumns
    const targetWidth = this.config.target.w
    const targetHeight = this.config.target.h

    // Return a no-op if the pixel is outside the target boundaries
    if (x < 0 || x >= targetWidth || y < 0 || y >= targetHeight) {
      return null
    }

    const tx = x >> shift
    const ty = y >> shift
    const id = ty * columns + tx

    let tile = this.lookup[id]
    let added = false

    if (!tile) {
      tile = this.pixelTilePool.getTile(id, tx, ty)

      this.extractState(tile)
      this.lookup[id] = tile
      this.beforeTiles.push(tile)
      added = true
    }

    return (didChange: boolean) => {
      if (!didChange && added) {
        this.beforeTiles.pop()
        this.lookup[id] = undefined
        this.pixelTilePool.releaseTile(tile!)
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
  ): DidChangeFn | null {
    const shift = this.config.tileShift
    const columns = this.config.targetColumns
    const targetWidth = this.config.target.w
    const targetHeight = this.config.target.h

    // Clamp the bounding box to the actual canvas dimensions
    const clipX1 = Math.max(0, x)
    const clipY1 = Math.max(0, y)
    const clipX2 = Math.min(targetWidth - 1, x + w - 1)
    const clipY2 = Math.min(targetHeight - 1, y + h - 1)

    // If the region is entirely off-canvas, return a no-op
    if (clipX2 < clipX1 || clipY2 < clipY1) {
      return null
    }

    const startX = clipX1 >> shift
    const startY = clipY1 >> shift
    const endX = clipX2 >> shift
    const endY = clipY2 >> shift

    const startIndex = this.beforeTiles.length

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        const id = ty * columns + tx
        let tile = this.lookup[id]

        if (!tile) {
          tile = this.pixelTilePool.getTile(id, tx, ty)

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
            this.pixelTilePool.releaseTile(t)
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
      tile = this.pixelTilePool.getTile(id, tx, ty)

      this.extractState(tile)
      this.lookup[id] = tile
      this.beforeTiles.push(tile)
      added = true
    }

    return (didChange: boolean) => {
      if (!didChange && added) {
        this.beforeTiles.pop()
        this.lookup[id] = undefined
        this.pixelTilePool.releaseTile(tile!)
      }
      return didChange
    }
  }

  extractState(tile: PixelTile) {
    const target = this.config.target
    const TILE_SIZE = this.config.tileSize
    const dst = tile.data
    const src = target.data
    const startX = tile.tx * TILE_SIZE
    const startY = tile.ty * TILE_SIZE
    const targetWidth = target.w
    const targetHeight = target.h

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
        let afterTile = this.pixelTilePool.getTile(beforeTile.id, beforeTile.tx, beforeTile.ty)

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
        this.pixelTilePool.releaseTile(tile)
      }
    }

    this.beforeTiles.length = 0
    this.lookup.length = 0
  }
}
