import type { PixelEngineConfig } from '../History/PixelEngineConfig'
import type { Rect } from '../Rect/_rect-types'
import type { Tile } from '../Tile/_tile-types'
import type { TilePool } from '../Tile/TilePool'

export function eachTileInBounds<T extends Tile>(
  config: PixelEngineConfig,
  lookup: (T | undefined)[],
  tilePool: TilePool<T>,
  bounds: Rect,
  callback: (tile: T, bX: number, bY: number, bW: number, bH: number) => void,
): void {
  const { tileShift, targetColumns, targetRows, tileSize } = config

  const x1 = Math.max(0, bounds.x >> tileShift)
  const y1 = Math.max(0, bounds.y >> tileShift)
  const x2 = Math.min(targetColumns - 1, (bounds.x + bounds.w - 1) >> tileShift)
  const y2 = Math.min(targetRows - 1, (bounds.y + bounds.h - 1) >> tileShift)

  if (x1 > x2 || y1 > y2) return

  for (let ty = y1; ty <= y2; ty++) {
    const rowOffset = ty * targetColumns
    const tileTop = ty << tileShift

    for (let tx = x1; tx <= x2; tx++) {
      const id = rowOffset + tx
      const tile = lookup[id] ?? (lookup[id] = tilePool.getTile(id, tx, ty))
      const tileLeft = tx << tileShift

      const startX = bounds.x > tileLeft ? bounds.x : tileLeft
      const startY = bounds.y > tileTop ? bounds.y : tileTop

      const maskEndX = bounds.x + bounds.w
      const tileEndX = tileLeft + tileSize
      const endX = maskEndX < tileEndX ? maskEndX : tileEndX

      const maskEndY = bounds.y + bounds.h
      const tileEndY = tileTop + tileSize
      const endY = maskEndY < tileEndY ? maskEndY : tileEndY

      callback(tile, startX, startY, endX - startX, endY - startY)
    }
  }
}
