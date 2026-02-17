export type SerializedImageData = {
  width: number,
  height: number,
  data: string,
}

/**
 * Serialize for use in JSON. Stored as base64 encoded string.
 */
export function serializeImageData<T extends ImageData>(imageData: T): SerializedImageData {
  const binary = String.fromCharCode(...new Uint8Array(imageData.data.buffer))
  const base64 = btoa(binary)

  return {
    width: imageData.width,
    height: imageData.height,
    data: base64,
  }
}

export function serializeNullableImageData<T extends ImageData | null>(imageData: T): T extends null ? null : SerializedImageData {
  if (!imageData) return null as any

  return serializeImageData(imageData) as any
}

export function deserializeImageData<T extends SerializedImageData>(serialized: T): ImageData {
  const binary = atob(serialized.data as string)
  const bytes = new Uint8ClampedArray(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new ImageData(bytes, serialized.width, serialized.height) as any
}

export function deserializeNullableImageData<T extends SerializedImageData | null>(serialized: T): T extends null ? null : ImageData {
  if (!serialized) return null as any
  return deserializeImageData(serialized) as any
}
