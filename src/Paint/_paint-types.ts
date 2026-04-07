import type { AlphaMask, BinaryMask } from '../_types'

interface BasePaintMask {
  readonly centerOffsetX: number
  readonly centerOffsetY: number
}

export interface PaintAlphaMask extends BasePaintMask, AlphaMask {
}

export interface PaintBinaryMask extends BasePaintMask, BinaryMask {
}

export type PaintMask = PaintAlphaMask | PaintBinaryMask

