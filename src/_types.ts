/** ALL values are 0-255 (including alpha which in CSS is 0-1) */
export type RGBA = { r: number, g: number, b: number, a: number }

/** Represents a 32-bit color in 0xAABBGGRR (Little endian) */
export type Color32 = number & { readonly __brandColor32: unique symbol }

/**
 * A function that defines how to combine a source color with a destination color.
 * @param src - The incoming color (source).
 * @param dst - The existing color in the buffer (destination).
 * @returns The resulting 32-bit color to be written to the buffer.
 */
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

/** Rectangle definition */
export type Rect = {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Defines how mask values should be interpreted during a draw operation.
 */
export enum MaskType {
  /**
   * Values are treated as alpha weights.
   * 0 is skipped, values > 0 are processed.
   */
  ALPHA,
  /**
   *  Values are treated as on/off.
   * 0 is fully transparent (skipped), any other value is fully opaque.
   */
  BINARY
}

/** Strictly 0 or 1 */
export type BinaryMask = Uint8Array & { readonly __brand: 'Binary' }
/** Strictly 0-255 */
export type AlphaMask = Uint8Array & { readonly __brand: 'Alpha' }

export type AnyMask = BinaryMask | AlphaMask

/**
 * Configuration for pixel manipulation operations.
 * Designed to be used by spreading a Rect object ({x, y, w, h}) directly.
 */
export interface PixelOptions {
  /**
   * The starting X coordinate in the destination buffer.
   * @Defaults 0.
   * */
  x?: number
  /**
   * The starting Y coordinate in the destination buffer.
   * @Default 0.
   * */
  y?: number
  /**
   * The width of the region to process.
   * @Default Source width.
   * */
  w?: number
  /**
   * The height of the region to process.
   * @Default Source height.
   * */
  h?: number

  /**
   * Overall layer opacity 0-255.
   * @default 255
   */
  alpha?: number

  /**
   * Mask width.
   * @default w
   * */
  mw?: number

  /**
   * X offset into the mask buffer.
   * @default 0
   * */
  mx?: number

  /**
   * Y offset into the mask buffer.
   * @default 0
   * */
  my?: number

  /** An optional mask to restrict where pixels are written. */
  mask?: AnyMask | null

  /** The interpretation logic for the provided mask. Defaults to MaskType.Binary. */
  maskType?: MaskType

  /** If true the inverse of the mask will be applied */
  invertMask?: boolean
}

/**
 * Configuration for blitting (copying/blending) one image into another.
 */
export interface PixelBlendOptions extends PixelOptions {
  /**
   * The source rectangle x-coordinate
   * @default 0
   */
  sx?: number

  /**
   * The source rectangle y-coordinate
   * @default 0
   */
  sy?: number

  /** The specific blending function/algorithm to use for pixel math. */
  blendFn?: BlendColor32
}

/**
 * Configuration for operations that require color blending.
 */
export interface ColorBlendOptions extends PixelOptions {
  /** The blending logic used to combine source and destination pixels. */
  blendFn?: BlendColor32
}

export type ApplyMaskOptions = Omit<PixelOptions, 'mask'>

// export function invertBinaryMask(dst: BinaryMask): void
// export function invertAlphaMask(dst: AlphaMask): void

