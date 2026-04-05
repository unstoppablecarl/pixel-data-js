import type { PixelEngineConfig } from '../History/PixelEngineConfig'

import { makePixelTile, type PixelTile } from './PixelTile'

export class PixelTilePool {
  public pool: PixelTile[]

  private tileSize: number
  private tileArea: number

  constructor(
    config: PixelEngineConfig,
  ) {
    this.pool = []
    this.tileSize = config.tileSize
    this.tileArea = config.tileArea
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

      // Wipe dirty memory from previous uses before handing it out
      tile.data32.fill(0)

      return tile
    }

    return makePixelTile(
      id,
      tx,
      ty,
      this.tileSize,
      this.tileArea,
    )
  }

  releaseTile(tile: PixelTile): void {
    this.pool.push(tile)
  }

  releaseTiles(tiles: (PixelTile | undefined)[]): void {
    let length = tiles.length

    for (let i = 0; i < length; i++) {
      let tile = tiles[i]

      if (tile) {
        this.pool.push(tile)
      }
    }

    tiles.length = 0
  }
}
