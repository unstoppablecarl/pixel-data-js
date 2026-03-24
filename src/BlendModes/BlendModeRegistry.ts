import type { BlendColor32 } from '../_types'
import type { BaseBlendModes } from './blend-modes'

export type BlendModeRegistry<
  BlendModes extends BaseBlendModes = BaseBlendModes,
  Name extends keyof BlendModes = keyof BlendModes,
  Index extends BlendModes[Name] = BlendModes[Name]
> = ReturnType<typeof makeBlendModeRegistry<BlendModes, Name, Index>>

export function makeBlendModeRegistry<
  BlendModes extends BaseBlendModes,
  Name extends keyof BlendModes = keyof BlendModes,
  Index extends BlendModes[Name] = BlendModes[Name]

>(
  blendModes: BlendModes,
  initialEntries: Record<Index, BlendColor32>,
  registryName = 'anonymous',
) {

  const blendToName = new Map<BlendColor32, Name>()
  const blendToIndex = new Map<BlendColor32, Index>()
  const indexToName: Name[] = []
  const indexToBlend: BlendColor32[] = []
  const nameToBlend = {} as { [K in keyof BlendModes]: BlendColor32 }
  const nameToIndex = {} as Record<Name, Index>

  const add = (name: Name, index: Index, blendFn: BlendColor32) => {
    if (!Number.isFinite(index)) {
      throw new Error(`Index "${index}" is not a number. Attempting to add name: "${name as string}", index: "${index}"`)
    }

    if (indexToBlend[index]) {
      throw new Error(`Blend Mode index: ${index} is already used. Attempting to add name: "${name as string}", index: "${index}"`)
    }

    indexToName[index] = name
    indexToBlend[index] = blendFn
    blendToIndex.set(blendFn, index)
    blendToName.set(blendFn, name)
    nameToBlend[name] = blendFn
    nameToIndex[name] = index
  }

  for (const [name, index] of Object.entries(blendModes)) {
    const blend = initialEntries[index as Index]
    add(name as Name, index as Index, blend)
  }

  return {
    registryName,
    nameToBlend,
    nameToIndex,

    blendToIndex,
    blendToName,

    indexToBlend,
    indexToName,

    indexType: null as unknown as Index,
    nameType: null as unknown as Name,
  }
}
