/**
 * Represents an image using a palette-based indexing system.
 * Instead of storing 4 bytes (RGBA) per pixel, this class stores a single index
 * into a color palette. This format is optimized for memory efficiency and
 * high-speed pattern matching or recoloring operations.
 */
export interface IndexedImage {
  /** The width of the image in pixels. */
  readonly w: number
  /** The height of the image in pixels. */
  readonly h: number
  /** Flat array of palette indices. Index = x + (y * width). */
  readonly data: Uint32Array
  /** The palette of unique 32-bit colors (ABGR/RGBA packed) found in the image. */
  readonly palette: Uint32Array
  /** The specific index in the palette reserved for fully transparent pixels. */
  readonly transparentPalletIndex: number
}
