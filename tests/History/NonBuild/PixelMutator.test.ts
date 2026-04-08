import {
  makeFullPixelMutator,
  makePixelTile,
  PixelAccumulator,
  PixelEngineConfig,
  PixelWriter,
  TilePool,
} from '@/index'
import glob from 'fast-glob'
import { describe, expect, it } from 'vitest'
import { makeTestPixelData } from '../../_helpers'

async function getMutatorsByName() {
  const files = await glob('src/History/PixelMutator/*.ts')
  let mutatorsByName = {}
  for (const f of files) {

    const imp = await import(f)
    mutatorsByName = {
      ...mutatorsByName,
      ...imp,
    }
  }
  return mutatorsByName
}

describe('PixelMutator Sync', () => {
  it('sync with PixelMutators dir', async () => {
    const target = makeTestPixelData(5, 5)
    const config = new PixelEngineConfig(8, target)
    const tilePool = new TilePool(config, makePixelTile)
    const accumulator = new PixelAccumulator(config, tilePool)

    const mutatorsByName = await getMutatorsByName()

    const writer = {
      target,
      accumulator,
    } as unknown as PixelWriter<any>

    let fullMutator = {}
    Object.entries(mutatorsByName).forEach(([_key, value]) => {
      fullMutator = {
        ...fullMutator,
        ...(value as any)(writer),
      }
    })

    const mutator = makeFullPixelMutator(writer)
    expect(Object.keys(mutator).sort()).toEqual(Object.keys(fullMutator).sort())
  })
})
