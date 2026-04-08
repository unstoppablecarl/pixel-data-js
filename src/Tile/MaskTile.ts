import { MaskType } from '../Mask/_mask-types'
import { type AlphaMaskTile, type BinaryMaskTile, type TileFactory, TileType } from './_tile-types'

export const makeAlphaMaskTile: TileFactory<AlphaMaskTile> = (
  id: number,
  tx: number,
  ty: number,
  tileSize: number,
  tileArea: number,
) => {
  return {
    tileType: TileType.MASK,
    type: MaskType.ALPHA,
    data: new Uint8Array(tileArea),
    w: tileSize,
    h: tileSize,
    id,
    tx,
    ty,
  }
}

export const makeBinaryMaskTile: TileFactory<BinaryMaskTile> = (
  id: number,
  tx: number,
  ty: number,
  tileSize: number,
  tileArea: number,
) => {
  return {
    tileType: TileType.MASK,
    type: MaskType.BINARY,
    data: new Uint8Array(tileArea),
    w: tileSize,
    h: tileSize,
    id,
    tx,
    ty,
  }
}
