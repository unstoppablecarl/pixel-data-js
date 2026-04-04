import { type HistoryMutator, PixelAccumulator, PixelEngineConfig, PixelTilePool, PixelWriter } from '@/index'
import { vi } from 'vitest'
import { makeTestPixelData, makeTestPixelDataLike } from '../../_helpers'

export function mockAccumulatorMutator<T extends {}, D extends {}>(mutatorFunction: HistoryMutator<T, D>, deps?: Partial<D>) {

  const target = makeTestPixelData(100, 100)
  const config = new PixelEngineConfig(16, target)
  const tilePool = new PixelTilePool(config)
  const accumulator = new PixelAccumulator(config, tilePool)

  // Mock the accumulator methods
  vi.spyOn(accumulator, 'storeRegionBeforeState')
  vi.spyOn(accumulator, 'storePixelBeforeState')

  // Create a mock writer object that provides what the mutators need
  const writer = {
    config,
    accumulator,
  } as unknown as PixelWriter<any>

  const mutator = mutatorFunction(writer, deps)

  return {
    mutator,
    accumulator,
    target,
    tilePool,
    config,
  }
}

export function mockMutator<T extends {}, D extends {}>(mutatorFunction: HistoryMutator<T, D>, deps: D, tw = 16, th = 16, tileSize = 8) {
  const target = makeTestPixelDataLike(tw, th)
  const config = new PixelEngineConfig(tileSize, target)
  const tilePool = new PixelTilePool(config)
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

  return {
    mutator,
    accumulator,
    target,
    tilePool,
    config,
    spyDeps,
  }
}
