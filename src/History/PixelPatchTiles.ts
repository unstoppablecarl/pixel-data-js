import type { IPixelData32 } from '../_types'
import { PixelTile } from '../PixelTile/PixelTile'

export type PixelPatchTiles = {
  beforeTiles: PixelTile[]
  afterTiles: PixelTile[]
}

export function applyPatchTiles(target: IPixelData32, tiles: PixelTile[], tileSize: number) {
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
