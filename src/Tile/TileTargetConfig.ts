import type { PixelData } from '../PixelData/_pixelData-types'
import type { TileTargetConfig, TileTargetMeta } from './_tile-types'

export function makeTileTargetConfig(
  tileSize: number,
  target: PixelData,
): TileTargetConfig {
  return {
    target,
    ...makeTileTargetMeta(tileSize, target),
  }
}

export function makeTileTargetMeta(
  tileSize: number,
  target: PixelData,
): TileTargetMeta {
  return {
    targetWidth: target.w,
    targetHeight: target.h,
    tileSize: tileSize,
    invTileSize: 1 / tileSize,
    tileArea: tileSize * tileSize,
    targetColumns: Math.ceil(target.w / tileSize),
    targetRows: Math.ceil(target.h / tileSize),
  }
}
