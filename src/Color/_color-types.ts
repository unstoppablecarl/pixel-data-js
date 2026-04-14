/** Represents a 32-bit color in 0xAABBGGRR (Little endian) */
export type Color32 = number & { readonly __brandColor32: unique symbol }

/** ALL values are 0-255 */
export type RGBA = { r: number, g: number, b: number, a: number }

/** r, g, b are 0-255. a is 0-1 for css use */
export type CssRGBA = { r: number, g: number, b: number, a: number } & { readonly __brandCssRGBA: unique symbol }
