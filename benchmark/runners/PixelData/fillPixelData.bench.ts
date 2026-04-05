import type { Color32, PixelData } from '@/_types'
import { command } from 'cmd-ts'
import { bench, do_not_optimize } from 'mitata-ts'
import { fillPixelData as fillPixelDataDist } from '../../../dist/index.prod'
import { writeBenchResultsJson } from '../../lib/benchmark-results'
import { makeRunner } from '../../lib/BenchmarkRunner'
import { errorsToProcessExit, runSelf } from '../../lib/cli'
import { makeMulberry32, makeRndColor, makeRndRealisticPixelData } from '../../lib/generate-test-data'
import { mitataRunner } from '../../lib/mitata'
import { benchGroup, DEFAULT_SEED, log, seed } from '../_args'

type FnOptions = {
  seed?: number,
}

export const fillPixelDataBenchmark = (opts: FnOptions) => {
  const width = 512
  const height = 512
  const seed = opts.seed ?? DEFAULT_SEED

  const rand = makeMulberry32(seed)

  const dst = makeRndRealisticPixelData({
    width,
    height,
    rand,
  })

  bench('fillPixelData', function* (state: any) {
    const color = state.get('color') as Color32
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
        return color
      },
      [2]() {
        return rect
      },
      bench(d: PixelData, c: any, r: any) {
        fillPixelDataDist(d, c, r)
        return do_not_optimize(d.data32[0])
      },
    }
  })
    .args({
      color: [makeRndColor(rand), makeRndColor(rand)],
      x: [10],
      y: [10],
      w: [32],
      h: [32],
    })
}

type CommandOptions = Required<FnOptions> & { group: string, log: boolean }

runSelf(import.meta.url, () => command({
  name: 'fillPixelData benchmark',
  args: {
    group: benchGroup,
    seed,
    log,
  },
  handler: async ({ seed, group, log }: CommandOptions) => {

    errorsToProcessExit(() => fillPixelDataBenchmark({
      seed,
    }))

    const results = await mitataRunner({ log })

    await writeBenchResultsJson({
      metaUrl: import.meta.url,
      jsonStr: results,
      group,
    })
  },
}))

export const runner = makeRunner<CommandOptions>(import.meta.url)
