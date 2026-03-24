import { type HistoryMutator, PixelAccumulator, PixelData, PixelEngineConfig, PixelWriter } from '@/index'
import { vi } from 'vitest'

export function mockAccumulatorMutator<T extends {}, D extends {}>(mutatorFunction: HistoryMutator<T, D>, deps?: Partial<D>) {

  const config = new PixelEngineConfig(16)
  const target = new PixelData(new ImageData(100, 100))
  const accumulator = new PixelAccumulator(target, config)

  // Mock the accumulator methods
  vi.spyOn(accumulator, 'storeRegionBeforeState')
  vi.spyOn(accumulator, 'storeTileBeforeState')

  // Create a mock writer object that provides what the mutators need
  const writer = {
    target,
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
