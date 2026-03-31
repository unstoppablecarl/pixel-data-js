import { type HistoryMutator, PixelAccumulator, PixelEngineConfig, PixelWriter } from '@/index'
import { vi } from 'vitest'
import { makeTestPixelData } from '../../_helpers'

export function mockAccumulatorMutator<T extends {}, D extends {}>(mutatorFunction: HistoryMutator<T, D>, deps?: Partial<D>) {

  const target = makeTestPixelData(100, 100)
  const config = new PixelEngineConfig(16, target)
  const accumulator = new PixelAccumulator(config)

  // Mock the accumulator methods
  vi.spyOn(accumulator, 'storeRegionBeforeState')
  vi.spyOn(accumulator, 'storeTileBeforeState')

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
    config,
  }
}
