import type { BlendColor32 } from '../_types'

export type BlendModeRegistry = ReturnType<typeof makeBlendModeRegistry>

export function makeBlendModeRegistry<
  BlendModes extends Record<string, number>,
  Name extends keyof BlendModes = keyof BlendModes,
  Index extends BlendModes[Name] = BlendModes[Name]
>(
  blendModes: BlendModes,
  initialEntries: Record<Index, BlendColor32>,
) {

  const modes: BlendColor32[] = []
  const toIndex = new Map<BlendColor32, Index>()
  const fromIndex = new Map<Index, BlendColor32>()
  const byName = {} as Record<Name, BlendColor32>

  const add = (name: Name, index: Index, blendFn: BlendColor32) => {
    if (modes[index]) {
      throw new Error(`Blend Mode index: ${index} is already used`)
    }

    if (byName[name]) {
      throw new Error(`Blend Mode name: "${name as string}" is already used`)
    }

    const idx = index
    modes[idx] = blendFn
    toIndex.set(blendFn, idx)
    fromIndex.set(idx, blendFn)
    ;(byName as any)[name] = blendFn
  }

  for (const [name, index] of Object.entries(blendModes)) {
    const blend = initialEntries[index as Index]
    add(name as Name, index as Index, blend)
  }

  return {
    modes,
    byName,
    toIndex,
    fromIndex,
    add,
    indexType: null as unknown as Index,
    nameType: null as unknown as Name
  }
}

/**
 * @internal
 */
export interface BaseBlendModeRegistry {
  overwrite: BlendColor32
  sourceOver: BlendColor32
  darken: BlendColor32
  multiply: BlendColor32
  colorBurn: BlendColor32
  linearBurn: BlendColor32
  darkerColor: BlendColor32
  lighten: BlendColor32
  screen: BlendColor32
  colorDodge: BlendColor32
  linearDodge: BlendColor32
  lighterColor: BlendColor32
  overlay: BlendColor32
  softLight: BlendColor32
  hardLight: BlendColor32
  vividLight: BlendColor32
  linearLight: BlendColor32
  pinLight: BlendColor32
  hardMix: BlendColor32
  difference: BlendColor32
  exclusion: BlendColor32
  subtract: BlendColor32
  divide: BlendColor32
}
