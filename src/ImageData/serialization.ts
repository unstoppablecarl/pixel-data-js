import type { Base64EncodedUInt8Array, ImageDataLike, SerializedImageData } from '../_types'

export function base64EncodeArrayBuffer(buffer: ArrayBufferLike): Base64EncodedUInt8Array {
  const binary = String.fromCharCode(...new Uint8Array(buffer))
  return btoa(binary) as Base64EncodedUInt8Array
}

export function base64DecodeArrayBuffer(encoded: Base64EncodedUInt8Array): Uint8ClampedArray<ArrayBuffer> {
  const binary = atob(encoded)
  const bytes = new Uint8ClampedArray(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * Serialize for use in JSON. Pixel data is stored as base64 encoded string.
 */
export function serializeImageData<T extends ImageDataLike>(imageData: T): SerializedImageData {
  return {
    width: imageData.width,
    height: imageData.height,
    data: base64EncodeArrayBuffer(imageData.data.buffer),
  }
}

export function serializeNullableImageData<T extends ImageDataLike | null>(imageData: T): T extends null ? null : SerializedImageData {
  if (!imageData) return null as any

  return serializeImageData(imageData) as any
}

export function deserializeRawImageData<T extends SerializedImageData>(serialized: T): ImageDataLike {
  return {
    width: serialized.width,
    height: serialized.height,
    data: base64DecodeArrayBuffer(serialized.data as Base64EncodedUInt8Array),
  }
}

export function deserializeImageData<T extends SerializedImageData>(serialized: T): ImageData {
  const data = base64DecodeArrayBuffer(serialized.data as Base64EncodedUInt8Array)

  return new ImageData(data as ImageDataArray, serialized.width, serialized.height) as any
}

export function deserializeNullableImageData<T extends SerializedImageData | null>(serialized: T): T extends null ? null : ImageData {
  if (!serialized) return null as any
  return deserializeImageData(serialized) as any
}
