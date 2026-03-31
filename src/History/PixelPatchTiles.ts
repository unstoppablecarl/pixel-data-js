import type { IPixelData } from '../_types'

export type PixelPatchTiles = {
  beforeTiles: PixelTile[]
  afterTiles: PixelTile[]
}

export class PixelTile {
  public data32: Uint32Array

  constructor(
    public id: number,
    public tx: number,
    public ty: number,
    tileArea: number,
  ) {
    this.data32 = new Uint32Array(tileArea)
  }
}

export function applyPatchTiles(target: IPixelData, tiles: PixelTile[], tileSize: number) {
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]

    if (!tile) continue

    const dst = target.data32
    const src = tile.data32
    const dstWidth = target.width
    const dstHeight = target.height
    const startX = tile.tx * tileSize
    const startY = tile.ty * tileSize

    // Calculate clamping to prevent wrapping artifacts on image edges
    const copyWidth = Math.max(0, Math.min(tileSize, dstWidth - startX))

    if (copyWidth <= 0) continue

    for (let ly = 0; ly < tileSize; ly++) {
      const globalY = startY + ly

      // Stop if we go below the image
      if (globalY >= dstHeight) break

      const dstIndex = globalY * dstWidth + startX
      const srcIndex = ly * tileSize
      const rowData = src.subarray(srcIndex, srcIndex + copyWidth)

      dst.set(rowData, dstIndex)
    }
  }
}
