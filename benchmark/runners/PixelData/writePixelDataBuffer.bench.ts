import type { PixelData } from '@/_types'
import { command } from 'cmd-ts'
import { bench, do_not_optimize } from 'mitata-ts'
import { writePixelDataBuffer as writePixelDataBufferDist } from '../../../dist/index.prod'
import type { BaseBenchCmdOpts } from '../../_types'
import { writeBenchResultsJson } from '../../lib/benchmark-results'
import { makeRunner } from '../../lib/BenchmarkRunner'
import { errorsToProcessExit, runSelf } from '../../lib/cli'
import { makeMulberry32, makeRndRealisticPixelBuffer, makeRndRealisticPixelData } from '../../lib/generate-test-data'
import { mitataRunner } from '../../lib/mitata'
import { benchGroup, blendNameOrIndex, blendType, DEFAULT_SEED, log, seed } from '../_args'

type FnOptions = {
  seed?: number,
}

export const writePixelDataBufferBenchmark = (
  opts: FnOptions,
) => {
  const width = 512
  const height = 512
  const seed = opts.seed ?? DEFAULT_SEED

  const rand = makeMulberry32(seed)

  const dst = makeRndRealisticPixelData({
    width,
    height,
    rand,
  })

  const src = makeRndRealisticPixelBuffer({
    length: 128 * 128,
    rand,
  })

  bench(`writePixelDataBuffer ${width}x${height}`, function* (state: any) {
    const x = state.get('x')
    const y = state.get('y')
    const w = state.get('w')
    const h = state.get('h')

    const rect = {
      x,
      y,
      w,
      h,
    }
    yield {
      [0]() {
        return dst
      },
      [1]() {
        return src
      },
      [2]() {
        return rect
      },
      bench(d: PixelData, b: Uint32Array, r: any) {
        writePixelDataBufferDist(d, b, r)
        return do_not_optimize(d.data32[0])
      },
    }
  })
    .args({
      x: [10],
      y: [10],
      w: [32],
      h: [32],
    })
}

export type CommandOptions = Required<FnOptions> & BaseBenchCmdOpts

runSelf(import.meta.url, () => command({
  name: 'writePixelDataBuffer benchmark',
  args: {
    group: benchGroup,
    seed,
    log,
    type: blendType,
    blend: blendNameOrIndex,
  },
  handler: async ({ seed, group, log }: CommandOptions) => {

    errorsToProcessExit(() => writePixelDataBufferBenchmark({
      seed,
    }))

    const jsonStr = await mitataRunner({
      log,
    })

    await writeBenchResultsJson({
      metaUrl: import.meta.url,
      jsonStr,
      group,
    })
  },
}))

export const runner = makeRunner<CommandOptions>(import.meta.url)
