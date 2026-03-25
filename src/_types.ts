import { PixelWriter, sourceOverPerfect } from './index'

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
export type BlendColor32 = {
  (src: Color32, dst: Color32): Color32,
  isOverwrite?: true
}

export type ImageDataLike = {
  width: number
  height: number
  data: Uint8ClampedArray<ArrayBufferLike>
}

export type ImageDataLikeConstructor<T extends ImageDataLike = ImageDataLike> = {
  new(
    data: Uint8ClampedArray,
    width: number,
    height: number,
  ): T
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

export type BinaryMaskRect = {
  x: number
  y: number
  w: number
  h: number
  mask: BinaryMask
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
export interface PixelRect {
  /**
   * The starting X coordinate in the destination buffer.
   * @default 0
   */
  x?: number

  /**
   * The starting Y coordinate in the destination buffer.
   * @default 0
   */
  y?: number

  /**
   * The width of the region in the destination buffer.
   * @default Source width.
   */
  w?: number

  /**
   * The height of the region in the destination buffer.
   * @default Source height.
   */
  h?: number
}

export interface MaskOffset {
  /**
   * X offset into the mask buffer.
   * @default 0
   */
  mx?: number

  /**
   * Y offset into the mask buffer.
   * @default 0
   */
  my?: number
}

export interface MaskOffsetWidth {
  /**
   * Mask width.
   * @default value of `w`
   */
  mw?: number
}

export interface InvertMask {

  /**
   * If true the inverse of the mask will be applied
   * @default false
   */
  invertMask?: boolean
}

export interface Alpha {
  /**
   * Overall layer opacity 0-255.
   * @default 255
   */
  alpha?: number
}

export interface ApplyMaskToPixelDataOptions extends PixelRect, Alpha, MaskOffsetWidth, MaskOffset, InvertMask {
}

export interface MergeAlphaMasksOptions extends PixelRect, Alpha, MaskOffset, InvertMask {

}

export interface PixelMutateOptions extends PixelRect, MaskOffset, MaskOffsetWidth, InvertMask {
  /** An optional mask to restrict where pixels are mutated. */
  mask?: BinaryMask | null
}

/**
 * Configuration for blitting (copying/blending) one image into another.
 */

export interface BasePixelBlendOptions {
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

  /**
   * The blending algorithm to use for blending pixels.
   * @default {@link sourceOverPerfect}
   */
  blendFn?: BlendColor32
}

export interface PixelBlendOptions extends PixelRect, Alpha, BasePixelBlendOptions {

}

export interface PixelBlendMaskOptions extends PixelRect, Alpha, MaskOffsetWidth, MaskOffset, InvertMask, BasePixelBlendOptions {
}

/**
 * Configuration for operations that require color blending.
 */
export interface ColorBlendOptions extends PixelRect, Alpha {
  /**
   * The blending algorithm to use for blending pixels.
   * @default {@link sourceOverPerfect}
   */
  blendFn?: BlendColor32
}

export interface ColorBlendMaskOptions extends ColorBlendOptions, MaskOffset, MaskOffsetWidth, InvertMask {
}

export type SelectionRect = Rect & ({
  mask: Uint8Array,
  maskType: MaskType,
} | {
  mask?: null
  maskType?: null,
})

export type HistoryMutator<T extends {}, D extends {}> = (writer: PixelWriter<any>, deps?: Partial<D>) => T

export interface IPixelData {
  readonly data32: Uint32Array
  readonly width: number
  readonly height: number
}
