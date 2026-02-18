// ALL values are 0-255 (including alpha which in CSS is 0-1)
export type RGBA = { r: number, g: number, b: number, a: number }

// A 32-bit integer containing r,g,b,a data
export type Color32 = number & { readonly __brandColor32: unique symbol }

export type BlendColor32 = (src: Color32, dst: Color32) => Color32

export type ImageDataLike = {
  width: number
  height: number
  data: Uint8ClampedArray<ArrayBuffer>
}

export type SerializedImageData = {
  width: number
  height: number
  data: string
}

export type Base64EncodedUInt8Array = string & { readonly __brandBase64UInt8Array: unique symbol }

export type Rect = { x: number; y: number; w: number; h: number }

export enum MaskType {
  ALPHA,
  BINARY
}

interface BaseMaskData {
  readonly width: number
  readonly height: number
  readonly data: Uint8Array
}

export interface AlphaMask extends BaseMaskData {
  readonly type: MaskType.ALPHA
}

export interface BinaryMask extends BaseMaskData {
  readonly type: MaskType.BINARY
}

export type AnyMask = AlphaMask | BinaryMask
