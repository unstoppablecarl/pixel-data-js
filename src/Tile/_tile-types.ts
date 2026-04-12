import type { AlphaMask, BinaryMask } from '../Mask/_mask-types'
import type { PixelData } from '../PixelData/_pixelData-types'

export const enum TileType {
  PIXEL,
  MASK,
}

interface BaseTile {
  tileType: TileType,
  id: number
  tx: number
  ty: number
  x: number
  y: number
}

export interface PixelTile extends PixelData, BaseTile {
}

export interface AlphaMaskTile extends AlphaMask, BaseTile {
}

export interface BinaryMaskTile extends BinaryMask, BaseTile {
}

export type Tile = PixelTile | AlphaMaskTile | BinaryMaskTile

export type TileFactory<T extends Tile> = (
  id: number,
  tx: number,
  ty: number,
  tileSize: number,
  tileArea: number,
) => T

export interface TileTargetMeta {
  readonly tileArea: number
  readonly targetColumns: number
  readonly targetRows: number
  readonly targetWidth: number
  readonly targetHeight: number
  readonly tileSize: number
  readonly invTileSize: number
}

export interface TileTargetConfig extends TileTargetMeta {
  readonly target: PixelData
}
