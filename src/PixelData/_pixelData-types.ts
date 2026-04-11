import type { ImageDataLike } from '../ImageData/_ImageData-types'

export interface PixelData32 {
  readonly data: Uint32Array
  readonly w: number
  readonly h: number
}

export interface MutablePixelData32 {
  data: Uint32Array
  w: number
  h: number
}

export interface PixelData<T extends ImageDataLike = ImageData> extends PixelData32 {
  readonly imageData: T
}

export interface MutablePixelData<T extends ImageDataLike = ImageData> extends PixelData32 {
  imageData: T
  data: Uint32Array
  w: number
  h: number
}
