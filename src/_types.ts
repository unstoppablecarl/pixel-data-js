// ALL values are 0-255 (including alpha which in CSS is 0-1)
export type RGBA = { r: number, g: number, b: number, a: number }

// A 32-bit integer containing r,g,b,a data
export type Color32 = number & { readonly __brandColor32: unique symbol };

// ALL values are floats from 0-1
export type RGBAFloat = RGBA & { readonly __brandRGBAFloat: unique symbol }

export type ImageDataLike = {
  width: number
  height: number
  data: Uint8ClampedArray
}

export type SerializedImageData = {
  width: number,
  height: number,
  data: string,
}

export type Base64EncodedUInt8Array = string & { readonly __brandBase64UInt8Array: unique symbol }
