import type { BlendModeRegistry } from '@/BlendModes/BlendModeRegistry'
import { makeFastBlendModeRegistry, makePerfectBlendModeRegistry } from '../dist/index.prod'
import type { BlendModeType } from './_types'

export const typeToDistRegistry = (type: BlendModeType) => {
  const result = type === 'fast'
    ? makeFastBlendModeRegistry()
    : makePerfectBlendModeRegistry()

  return result as unknown as BlendModeRegistry
}
