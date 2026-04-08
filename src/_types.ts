import type { BinaryMask } from './Mask/_mask-types'

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

export interface InvertMask {
  /**
   * If true the inverse of the mask will be applied
   * @default false
   */
  invertMask?: boolean
}

interface Alpha {
  /**
   * Overall layer opacity 0-255.
   * @default 255
   */
  alpha?: number
}

export interface ApplyMaskToPixelDataOptions extends PixelRect, Alpha, MaskOffset, InvertMask {
}

export interface MergeAlphaMasksOptions extends PixelRect, Alpha, MaskOffset, InvertMask {
}

export interface PixelMutateOptions extends PixelRect, MaskOffset, InvertMask {
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

export interface PixelBlendMaskOptions extends PixelRect, Alpha, MaskOffset, InvertMask, BasePixelBlendOptions {
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

export interface ColorBlendMaskOptions extends ColorBlendOptions, MaskOffset, InvertMask {
}
