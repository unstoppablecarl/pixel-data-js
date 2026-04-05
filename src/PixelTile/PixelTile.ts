import type { IPixelData } from '../_types'

export type PixelTile = IPixelData & {
  id: number
  tx: number
  ty: number
}

export function makePixelTile(
  id: number,
  tx: number,
  ty: number,
  tileSize: number,
  tileArea: number,
): PixelTile {
  const data32 = new Uint32Array(tileArea)
  const data8 = new Uint8ClampedArray(data32.buffer) as Uint8ClampedArray<ArrayBuffer>

  new ImageData(data8, tileSize, tileSize)
  return {
    id,
    tx,
    ty,
    width: tileSize,
    height: tileSize,
    data32,
    imageData: new ImageData(data8, tileSize, tileSize),
  }
}
