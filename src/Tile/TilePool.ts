import type { Tile, TileFactory } from './_tile-types'

export class TilePool<T extends Tile> {
  public pool: T[]

  protected tileArea: number

  constructor(
    protected tileSize: number,
    protected tileFactory: TileFactory<T>,
  ) {
    this.pool = []
    this.tileSize = tileSize
    this.tileArea = tileSize * tileSize
  }

  getTile(
    id: number,
    tx: number,
    ty: number,
  ): T {
    let tile = this.pool.pop()
    const tileSize = this.tileSize

    if (tile) {
      tile.id = id
      tile.tx = tx
      tile.ty = ty
      tile.x = tx * tileSize
      tile.y = ty * tileSize

      // Wipe dirty memory from previous uses before handing it out
      tile.data.fill(0)

      return tile
    }

    return this.tileFactory(
      id,
      tx,
      ty,
      tileSize,
      this.tileArea,
    )
  }

  releaseTile(tile: T): void {
    this.pool.push(tile)
  }

  releaseTiles(tiles: (T | undefined)[]): void {
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
