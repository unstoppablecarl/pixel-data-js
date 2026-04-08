import type { Rect } from '../_types'

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

export interface BaseMask {
  readonly type: MaskType
  readonly data: Uint8Array
  readonly w: number
  readonly h: number
}

export type Mask = BinaryMask | AlphaMask

/** Strictly 0 or 1 */
export interface BinaryMask extends BaseMask {
  readonly type: MaskType.BINARY
}

/** Strictly 0-255 */
export interface AlphaMask extends BaseMask {
  readonly type: MaskType.ALPHA
}

export type MaskRect<T extends MaskType> = Rect & {
  type: T
  data: Uint8Array
}
export type BinaryMaskRect = MaskRect<MaskType.BINARY>
export type AlphaMaskRect = MaskRect<MaskType.ALPHA>
export type NullableBinaryMaskRect = Rect & ({
  type: MaskType.BINARY
  data: Uint8Array
} | {
  type?: null
  data?: null
})
export type NullableMaskRect = Rect & ({
  type: MaskType
  data: Uint8Array
} | {
  type?: null
  data?: null
})
