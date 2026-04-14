import { toBlendModeIndexAndName } from '@/BlendModes/toBlendModeIndexAndName'
import type { Color32 } from '@/Color/_color-types'
import { command } from 'cmd-ts'
import { bench, do_not_optimize, group } from 'mitata-ts'
import { typeToDistRegistry } from '../../_dist-loaders'
import type { BaseBenchCmdOpts, BlendModeType } from '../../_types'
import { writeBenchResultsJson } from '../../lib/benchmark-results'
import { makeRunner } from '../../lib/BenchmarkRunner'
import { errorsToProcessExit, runSelf } from '../../lib/cli'
import { makeMulberry32, makeRndRealisticPixelBuffer } from '../../lib/generate-test-data'
import { mitataRunner } from '../../lib/mitata'
import {
  benchGroup,
  blendNameOrIndex,
  blendType,
  DEFAULT_BLEND_MODE_TYPE,
  DEFAULT_BLEND_OR_INDEX,
  DEFAULT_ITERATIONS,
  DEFAULT_SEED,
  iterations,
  log,
  seed,
} from '../_args'

type FnOpts = {
  blend?: number | string,
  type?: BlendModeType,
  iterations?: number,
  seed?: number,
}

export const blendModeFunctionBenchmark = (opts: FnOpts) => {
  const blend = opts.blend ?? DEFAULT_BLEND_OR_INDEX
  const type = opts.type ?? DEFAULT_BLEND_MODE_TYPE
  const seed = opts.seed ?? DEFAULT_SEED
  const iterations = opts.iterations ?? DEFAULT_ITERATIONS

  const rand = makeMulberry32(seed)

  const registry = typeToDistRegistry(type)
  const { blendIndex, blendName } = toBlendModeIndexAndName(blend)

  const blendFn = registry.indexToBlend[blendIndex]

  // 1. The Predictable Arrays (Best Case Scenario)
  const srcPredictable = makeRndRealisticPixelBuffer({
    length: iterations,
    rand,
    opaqueRatio: 1.0,
    transparentRatio: 0.0,
  })

  const dstPredictable = makeRndRealisticPixelBuffer({
    length: iterations,
    rand,
    opaqueRatio: 1.0,
    transparentRatio: 0.0,
  })

  // 2. The Real-World Arrays (Branch Prediction Thrashing)
  const srcMixed = makeRndRealisticPixelBuffer({
    length: iterations,
    rand,
    opaqueRatio: 0.85,
    transparentRatio: 0.10,
  })

  const dstMixed = makeRndRealisticPixelBuffer({
    length: iterations,
    rand,
    opaqueRatio: 1.0,
    transparentRatio: 0.0,
  })

  group(`blendMode: ${type}: ${blendName}`, () => {
    bench(`hot array: predictable (100% opaque)`, function* () {
      yield {
        [0]() {
          return srcPredictable
        },
        [1]() {
          return dstPredictable
        },
        bench(s: Uint32Array, d: Uint32Array) {
          let checksum = 0
          for (let i = 0; i < iterations; i++) {
            // Using bitwise XOR to accumulate a single result without math overhead
            checksum ^= blendFn(s[i] as Color32, d[i] as Color32)
          }
          return do_not_optimize(checksum)
        },
      }
    })

    bench(`hot array: mixed (real-world branch prediction)`, function* () {
      yield {
        [0]() {
          return srcMixed
        },
        [1]() {
          return dstMixed
        },
        bench(s: Uint32Array, d: Uint32Array) {
          let checksum = 0
          for (let i = 0; i < iterations; i++) {
            checksum ^= blendFn(s[i] as Color32, d[i] as Color32)
          }
          return do_not_optimize(checksum)
        },
      }
    })

  })

  return {
    blendIndex,
    blendName,
  }
}

const config = {
  name: 'blend-mode',
  description: 'Benchmark blend mode functions',
  args: {
    blend: blendNameOrIndex,
    type: blendType,
    iterations,
    seed,
    log,
    group: benchGroup,
  },
}

type CommandOptions = Required<FnOpts> & BaseBenchCmdOpts

runSelf(import.meta.url, () => command({
  ...config,
  handler: async ({ type, blend, iterations, seed, log, group }: CommandOptions) => {
    const { blendName } = errorsToProcessExit(() => blendModeFunctionBenchmark({
        blend,
        type,
        iterations,
        seed,
      }),
    )

    const jsonStr = await mitataRunner({ log })

    await writeBenchResultsJson({
      metaUrl: import.meta.url,
      prefix: type + '-' + blendName,
      jsonStr,
      group,
    })
  },
}))

export const runner = makeRunner<CommandOptions>(import.meta.url)

export const callBlendModeBenchmark = runner.cmdCall
