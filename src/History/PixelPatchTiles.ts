import type { PixelData32 } from '../PixelData/_pixelData-types'
import type { PixelTile } from '../Tile/_tile-types'

export type PixelPatchTiles = {
  beforeTiles: PixelTile[]
  afterTiles: PixelTile[]
}

export function applyPatchTiles(target: PixelData32, tiles: PixelTile[], tileSize: number) {
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i]

    if (!tile) continue

    const dst = target.data
    const src = tile.data
    const dstWidth = target.w
    const dstHeight = target.h
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
