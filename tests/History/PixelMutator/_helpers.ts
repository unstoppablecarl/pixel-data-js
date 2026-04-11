import {
  type HistoryMutator,
  makePixelTile,
  PixelAccumulator,
  PixelEngineConfig,
  PixelWriter,
  setPixelData,
  TilePool,
} from '@/index'
import { vi } from 'vitest'
import { makeTestPixelDataLike, pack } from '../../_helpers'

export function mockMutator<T extends {}, D extends {}>(mutatorFunction: HistoryMutator<T, D>, deps: D, tw = 16, th = 16, tileSize = 8, fill = pack(255, 255, 0, 255)) {
  const target = makeTestPixelDataLike(tw, th, fill)
  const config = new PixelEngineConfig(tileSize, target)
  const tilePool = new TilePool(config, makePixelTile)
  const accumulator = new PixelAccumulator(config, tilePool)

  // Mock the accumulator methods
  vi.spyOn(accumulator, 'storeRegionBeforeState')
  vi.spyOn(accumulator, 'storePixelBeforeState')

  // Create a mock writer object that provides what the mutators need
  const writer = {
    config,
    accumulator,
  } as unknown as PixelWriter<any>

  type SpiedDeps<D> = {
    [K in keyof D]: D[K] extends (...args: any[]) => any
      ? ReturnType<typeof vi.fn<D[K]>>
      : never;
  };

  const spyDeps = Object.fromEntries(
    Object.entries(deps).map(([key, value]) => [
      key,
      vi.fn(value as (...args: any[]) => any),
    ]),
  ) as SpiedDeps<D>

  const mutator = mutatorFunction(writer, spyDeps as D)

  function reset() {
    setPixelData(target, makeTestPixelDataLike(tw, th, fill).imageData)
  }

  return {
    mutator,
    accumulator,
    target,
    tilePool,
    config,
    spyDeps,
    reset,
  }
}
