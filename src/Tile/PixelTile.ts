import { type PixelTile, TileType } from './_tile-types'

export function makePixelTile(
  id: number,
  tx: number,
  ty: number,
  tileSize: number,
  tileArea: number,
): PixelTile {
  const data32 = new Uint32Array(tileArea)
  const data8 = new Uint8ClampedArray(data32.buffer) as Uint8ClampedArray<ArrayBuffer>

  return {
    tileType: TileType.PIXEL,
    id,
    tx,
    ty,
    w: tileSize,
    h: tileSize,
    data: data32,
    imageData: new ImageData(data8, tileSize, tileSize),
  }
}
