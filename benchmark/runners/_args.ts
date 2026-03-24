import { BaseBlendMode } from '@/BlendModes/blend-modes'
import { flag, option, string } from 'cmd-ts'
import { BLEND_MODE_TYPES, type BlendModeType } from '../_types'
import { cmdValidateInt, makeEnumValidator } from '../lib/cli'

export const DEFAULT_ITERATIONS = 10_000
export const iterations = option({
  long: 'iterations',
  short: 'i',
  type: cmdValidateInt,
  defaultValue: () => DEFAULT_ITERATIONS,
  defaultValueIsSerializable: true,
})

export const DEFAULT_SEED = 1

export const seed = option({
  long: 'seed',
  short: 's',
  type: cmdValidateInt,
  defaultValue: () => DEFAULT_SEED,
  defaultValueIsSerializable: true,
})

export const benchGroup = option({
  long: 'group',
  short: 'g',
  description: 'Benchmark group dir name. Defaults to current git branch',
  type: string,
  defaultValue: () => '',
})

export const DEFAULT_BLEND_MODE_TYPE: BlendModeType = 'fast'

export const blendType = option({
  long: 'type',
  short: 't',
  type: makeEnumValidator(BLEND_MODE_TYPES),
  description: 'Registry type: fast or perfect',
  defaultValue: () => DEFAULT_BLEND_MODE_TYPE,
  defaultValueIsSerializable: true,
})

export const DEFAULT_BLEND_OR_INDEX = BaseBlendMode.sourceOver

export const blendNameOrIndex = option({
  long: 'blend',
  short: 'b',
  type: makeEnumValidator([
    ...Object.values(BaseBlendMode),
    ...Object.keys(BaseBlendMode),
  ]),
  description: 'Blend mode name or index (e.g. "sourceOver" or 0)',
  defaultValue: () => DEFAULT_BLEND_OR_INDEX,
  defaultValueIsSerializable: true,
})

export const log = flag({
  long: 'log',
  short: 'l',
  description: 'show mitata logs',
  defaultValue: () => false,
  defaultValueIsSerializable: true,
})

