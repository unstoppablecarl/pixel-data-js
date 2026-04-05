import type { PixelData } from '@/_types'
import { toBlendModeIndexAndName } from '@/BlendModes/toBlendModeIndexAndName'
import { command } from 'cmd-ts'
import { bench, do_not_optimize, group } from 'mitata-ts'
import { blendPixelData as blendPixelDataDist } from '../../../dist/index.prod'
import { typeToDistRegistry } from '../../_dist-loaders'
import type { BaseBenchCmdOpts, BlendModeType } from '../../_types'
import { runnerResultFilePath, writeBenchResultsJson } from '../../lib/benchmark-results'
import type { BenchmarkFileWriter, BenchmarkRunner } from '../../lib/BenchmarkRunner'
import { cmd, errorsToProcessExit, runSelf } from '../../lib/cli'
import { makeMulberry32, makeRndRealisticPixelData } from '../../lib/generate-test-data'
import { mitataRunner } from '../../lib/mitata'
import {
  benchGroup,
  blendNameOrIndex,
  blendType,
  DEFAULT_BLEND_MODE_TYPE,
  DEFAULT_BLEND_OR_INDEX,
  DEFAULT_SEED,
  log,
  seed,
} from '../_args'

type FnOptions = {
  blend?: number | string,
  type?: BlendModeType,
  seed?: number,
}

export const blendPixelDataBenchmark = (
  opts: FnOptions,
) => {
  const width = 512
  const height = 512
  const blend = opts.blend ?? DEFAULT_BLEND_OR_INDEX
  const type = opts.type ?? DEFAULT_BLEND_MODE_TYPE
  const seed = opts.seed ?? DEFAULT_SEED

  const rand = makeMulberry32(seed)

  const registry = typeToDistRegistry(type)
  const { blendIndex, blendName } = toBlendModeIndexAndName(blend)
  const blendFn = registry.indexToBlend[blendIndex]

  const src = makeRndRealisticPixelData({
    width,
    height,
    rand,
  })

  const dst = makeRndRealisticPixelData({
    width,
    height,
    rand,
  })
  const argsMap = {
    alpha: [255, 128],
    w: [rand.int(width), rand.int(width)],
    h: [rand.int(height), rand.int(height)],
  }
  group(`blendPixelData: ${width}x${height}`, () => {
    bench(`${type}: ${blendName}: minimal`, function* (_state: any) {
      const blendOpts = {
        blendFn,
      }

      yield {
        [0]() {
          return dst
        },
        [1]() {
          return src
        },
        [2]() {
          return blendOpts
        },
        bench(d: PixelData, s: PixelData, o: any) {
          blendPixelDataDist(d, s, o)
          return do_not_optimize(d.data32[0])
        },
      }
    })

    bench(`${type}: ${blendName}: alpha`, function* (state: any) {
      const alpha = state.get('alpha')

      const blendOpts = {
        alpha,
        blendFn,
      }

      yield {
        [0]() {
          return dst
        },
        [1]() {
          return src
        },
        [2]() {
          return blendOpts
        },
        bench(d: PixelData, s: PixelData, o: any) {
          blendPixelDataDist(d, s, o)
          return do_not_optimize(d.data32[0])
        },
      }
    })
      .args({
        alpha: [255, 128],
      })

    bench(`${type}: ${blendName} offset`, function* (state: any) {
      const w = state.get('w')
      const h = state.get('h')
      const alpha = state.get('alpha')

      const blendOpts = {
        x: 10,
        y: 10,
        sx: 0,
        sy: 0,
        w,
        h,
        alpha,
        blendFn,
      }

      yield {
        [0]() {
          return dst
        },
        [1]() {
          return src
        },
        [2]() {
          return blendOpts
        },
        bench(d: PixelData, s: PixelData, o: any) {
          blendPixelDataDist(d, s, o)
          return do_not_optimize(d.data32[0])
        },
      }
    })
      .args(argsMap)
  })
}

export type CommandOptions = Required<FnOptions> & BaseBenchCmdOpts

runSelf(import.meta.url, () => command({
  name: 'blendPixelData benchmark',
  args: {
    group: benchGroup,
    seed,
    log,
    type: blendType,
    blend: blendNameOrIndex,
  },
  handler: async ({ blend, type, seed, group, log }: CommandOptions) => {

    const { blendName } = errorsToProcessExit(() => toBlendModeIndexAndName(blend))

    errorsToProcessExit(() => blendPixelDataBenchmark({
      blend,
      type,
      seed,
    }))

    const jsonStr = await mitataRunner({
      log,
    })

    const prefix = benchPrefix(type, blendName)
    await writeBenchResultsJson({
      metaUrl: import.meta.url,
      jsonStr,
      prefix,
      group,
    })
  },
}))
const benchPrefix = (type: BlendModeType, blendName: string) => type + '-' + blendName

export const callBlendPixelDataBenchmark = cmd<CommandOptions>(import.meta.url)

type Runner = BenchmarkRunner<CommandOptions> & BenchmarkFileWriter<{
  type: BlendModeType,
  blendName: string
}>

export const runner: Runner = {
  cmdCall: callBlendPixelDataBenchmark,
  outputFilePath({ group, type, blendName }) {
    const prefix = benchPrefix(type, blendName)
    return runnerResultFilePath(import.meta.url, group, prefix)
  },
}
