import type { PixelData32 } from '@/_types'
import sharp from 'sharp'

export async function uint32ArrayToPngBuffer(
  data: Uint32Array,
  width: number,
  height: number,
) {
  const buffer = Buffer.from(data.buffer, data.byteOffset, data.byteLength)

  const image = sharp(buffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })

  return await image.png({ compressionLevel: 9 }).toBuffer()
}

export async function pixelDataToPngBuffer(target: PixelData32) {
  return uint32ArrayToPngBuffer(target.data32, target.width, target.height)
}
