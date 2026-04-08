export interface ImageDataLike {
  width: number
  height: number
  data: Uint8ClampedArray<ArrayBufferLike>
}

export type SerializedImageData = {
  width: number
  height: number
  data: string
}

export type Base64EncodedUInt8Array = string & { readonly __brandBase64UInt8Array: unique symbol }
