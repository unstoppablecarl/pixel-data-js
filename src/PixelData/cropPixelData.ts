import type { MutablePixelData, PixelData, PixelData32 } from './_pixelData-types'
import { setPixelData } from './PixelData'

export function cropPixelData(src: PixelData32, x: number, y: number, w: number, h: number, out?: MutablePixelData): PixelData {
  const cx = Math.max(x, 0)
  const cy = Math.max(y, 0)
  const cw = Math.min(x + w, src.w) - cx
  const ch = Math.min(y + h, src.h) - cy

  if (cw <= 0 || ch <= 0) {
    throw new Error(`Crop [${x},${y} ${w}x${h}] does not overlap PixelData [${src.w}x${src.h}]`)
  }

  const cropped = new ImageData(cw, ch)

  let dst32: Uint32Array
  if (out) {
    setPixelData(out, cropped)
    dst32 = out.data
  } else {
    dst32 = new Uint32Array(cropped.data.buffer)
  }

  for (let row = 0; row < ch; row++) {
    const srcOffset = ((cy + row) * src.w) + cx
    const dstOffset = row * cw
    dst32.set(src.data.subarray(srcOffset, srcOffset + cw), dstOffset)
  }

  return out ?? {
    data: dst32,
    imageData: cropped,
    w: cw,
    h: ch,
  }
}
