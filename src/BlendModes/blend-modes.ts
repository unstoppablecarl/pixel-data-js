import type { BlendColor32 } from '../_types'
import { FAST_BLEND_TO_INDEX, INDEX_TO_FAST_BLEND } from './blend-modes-fast'
import { type INDEX_TO_PERFECT_BLEND, PERFECT_BLEND_TO_INDEX } from './blend-modes-perfect'

// The enum index IS the permanent ID.
// do not change the order, Adding to it is ok.
export enum BlendMode {
  overwrite,
  sourceOver,

  darken,
  multiply,
  colorBurn,
  linearBurn,
  darkerColor,

  lighten,
  screen,
  colorDodge,
  linearDodge,
  lighterColor,

  overlay,
  softLight,
  hardLight,
  vividLight,
  linearLight,
  pinLight,
  hardMix,

  difference,
  exclusion,
  subtract,
  divide,
}

export type BlendModeIndex = typeof BlendMode[keyof typeof BlendMode];

export type BaseIndexToBlendGetter<I extends BlendModeIndex, B extends BlendColor32> = {
  get: (index: I) => B
}
export type IndexToBlendGetter = typeof INDEX_TO_FAST_BLEND | typeof INDEX_TO_PERFECT_BLEND

export type BaseBlendToIndexGetter<I extends BlendModeIndex, B extends BlendColor32> = {
  get: (blend: B) => I
}

export type BlendToIndexGetter = typeof FAST_BLEND_TO_INDEX | typeof PERFECT_BLEND_TO_INDEX

