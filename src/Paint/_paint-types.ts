import type { AlphaMask, BinaryMask } from '../_types'

export enum PaintMaskShape {
  CIRCLE,
  RECT
}

interface BasePaintMask {
  readonly centerOffsetX: number
  readonly centerOffsetY: number
}

export interface PaintAlphaMask extends BasePaintMask, AlphaMask {
}

export interface PaintBinaryMask extends BasePaintMask, BinaryMask {
}

export type PaintMask = PaintAlphaMask | PaintBinaryMask

export type PaintCursorSettings = {
  scale: number,
  cssColor: string,
} & ({
  shape: PaintMaskShape.CIRCLE,
  size: number,
} | {
  shape: PaintMaskShape.RECT,
  w: number,
  h: number,
})
