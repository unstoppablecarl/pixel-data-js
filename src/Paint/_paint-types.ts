import type { AlphaMask, BinaryMask } from '../_types'

export enum PaintMaskOutline {
  MASKED,
  CIRCLE,
  RECT,
}

interface BasePaintMask<T extends PaintMaskOutline = PaintMaskOutline> {
  readonly outlineType: T
  readonly centerOffsetX: number
  readonly centerOffsetY: number
}

export interface PaintAlphaMask<T extends PaintMaskOutline = PaintMaskOutline> extends BasePaintMask<T>, AlphaMask {
}

export interface PaintBinaryMask<T extends PaintMaskOutline = PaintMaskOutline> extends BasePaintMask<T>, BinaryMask {
}

export type PaintMask = PaintAlphaMask<any> | PaintBinaryMask<any>

export type PaintCursor = {
  outlineType: PaintMaskOutline
  centerOffsetX: number
  centerOffsetY: number
  w: number
  h: number
}
