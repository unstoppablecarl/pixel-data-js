import type { BlendColor32 } from '../_types'
import type { BlendModeIndex } from './blend-modes'
import { FAST_BLEND_TO_INDEX, INDEX_TO_FAST_BLEND } from './blend-modes-fast'
import { type INDEX_TO_PERFECT_BLEND, PERFECT_BLEND_TO_INDEX } from './blend-modes-perfect'

export type BaseIndexToBlendGetter<B extends BlendColor32> = {
  get: (index: BlendModeIndex) => B
}
export type IndexToBlendGetter = typeof INDEX_TO_FAST_BLEND | typeof INDEX_TO_PERFECT_BLEND

export type BaseBlendToIndexGetter<B extends BlendColor32> = {
  get: (blend: B) => BlendModeIndex
}
export type BlendToIndexGetter = typeof FAST_BLEND_TO_INDEX | typeof PERFECT_BLEND_TO_INDEX
