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
