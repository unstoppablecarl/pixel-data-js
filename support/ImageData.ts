import type { ImageDataLike } from '@/_types'
import type { ImageData } from '@napi-rs/canvas'

export const makeImageData = <T extends ImageDataLike = ImageData>(
  w: number,
  h: number,
): T => {
  return {
    width: w,
    height: h,
    data: new Uint8ClampedArray(w * h * 4),
  } as T
}
