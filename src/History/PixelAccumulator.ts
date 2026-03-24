import type { IPixelData } from '../_types'
import type { PixelEngineConfig } from './PixelEngineConfig'
import { type PixelPatchTiles, PixelTile } from './PixelPatchTiles'

export class PixelAccumulator {
  public lookup: (PixelTile | undefined)[]
  public beforeTiles: PixelTile[]
  public pool: PixelTile[]

  constructor(
    public target: IPixelData,
    readonly config: PixelEngineConfig,
  ) {
    this.lookup = []
    this.beforeTiles = []
    this.pool = []
  }

  getTile(
    id: number,
    tx: number,
    ty: number,
  ): PixelTile {
    let tile = this.pool.pop()

    if (tile) {
      tile.id = id
      tile.tx = tx
      tile.ty = ty

      return tile
    }

    return new PixelTile(
      id,
      tx,
      ty,
      this.config.tileArea,
    )
  }

  recyclePatch(patch: PixelPatchTiles) {
    const before = patch.beforeTiles

    for (let i = 0; i < before.length; i++) {
      let tile = before[i]

      if (tile) {
        this.pool.push(tile)
      }
    }

    const after = patch.afterTiles

    for (let i = 0; i < after.length; i++) {
      let tile = after[i]

      if (tile) {
        this.pool.push(tile)
      }
    }
  }

  /**
   * @param x pixel x coordinate
   * @param y pixel y coordinate
   */
  storeTileBeforeState(x: number, y: number): void {
    let target = this.target
    let shift = this.config.tileShift
    let columns = (target.width + this.config.tileMask) >> shift
    let tx = x >> shift
    let ty = y >> shift
    let id = ty * columns + tx

    let tile = this.lookup[id]

    if (!tile) {
      tile = this.getTile(
        id,
        tx,
        ty,
      )

      this.extractState(tile)
      this.lookup[id] = tile
      this.beforeTiles.push(tile)
    }
  }

  /**
   *
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
  ) {
    let target = this.target
    let shift = this.config.tileShift
    let columns = (target.width + this.config.tileMask) >> shift

    let startX = x >> shift
    let startY = y >> shift
    let endX = (x + w - 1) >> shift
    let endY = (y + h - 1) >> shift

    for (let ty = startY; ty <= endY; ty++) {
      for (let tx = startX; tx <= endX; tx++) {
        let id = ty * columns + tx
        let tile = this.lookup[id]

        if (!tile) {
          tile = this.getTile(
            id,
            tx,
            ty,
          )

          this.extractState(tile)
          this.lookup[id] = tile
          this.beforeTiles.push(tile)
        }
      }
    }
  }

  extractState(tile: PixelTile) {
    let target = this.target
    let TILE_SIZE = this.config.tileSize
    let dst = tile.data32
    let src = target.data32
    let startX = tile.tx * TILE_SIZE
    let startY = tile.ty * TILE_SIZE
    let targetWidth = target.width
    let targetHeight = target.height

    let copyWidth = Math.max(0, Math.min(TILE_SIZE, targetWidth - startX))

    for (let ly = 0; ly < TILE_SIZE; ly++) {
      let globalY = startY + ly
      let dstIndex = ly * TILE_SIZE

      if (globalY < 0 || globalY >= targetHeight || copyWidth === 0) {
        dst.fill(0, dstIndex, dstIndex + TILE_SIZE)
        continue
      }

      let srcIndex = globalY * targetWidth + startX
      let rowData = src.subarray(srcIndex, srcIndex + copyWidth)

      dst.set(rowData, dstIndex)

      if (copyWidth < TILE_SIZE) {
        dst.fill(0, dstIndex + copyWidth, dstIndex + TILE_SIZE)
      }
    }
  }

  extractAfterTiles(): PixelTile[] {
    let afterTiles: PixelTile[] = []
    let length = this.beforeTiles.length

    for (let i = 0; i < length; i++) {
      let beforeTile = this.beforeTiles[i]

      if (beforeTile) {
        let afterTile = this.getTile(
          beforeTile.id,
          beforeTile.tx,
          beforeTile.ty,
        )

        this.extractState(afterTile)
        afterTiles.push(afterTile)
      }
    }

    return afterTiles
  }

  reset() {
    this.lookup = []
    this.beforeTiles = []
  }
}
