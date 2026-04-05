import type { ImageDataLike } from '../_types'

/**
 * converts {@link ImageData} to a faster Uint32Array
 */
export function imageDataToUInt32Array(imageData: ImageDataLike): Uint32Array {
  return _macro_imageDataToUInt32Array(imageData)
}

// @__INLINE_MACRO__
export function _macro_imageDataToUInt32Array(imageData: ImageDataLike): Uint32Array {
  return new Uint32Array(
    imageData.data.buffer,
    imageData.data.byteOffset,
    // Shift right by 2 is a fast bitwise division by 4.
    imageData.data.byteLength >> 2,
  )
}
