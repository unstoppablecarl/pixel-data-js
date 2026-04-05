import type { PixelData, Rect } from '@/_types'
import { command } from 'cmd-ts'
import { bench, do_not_optimize, group } from 'mitata-ts'
import { extractPixelDataBuffer as extractPixelDataBufferDist } from '../../../dist/index.prod'
import type { BaseBenchCmdOpts } from '../../_types'
import { writeBenchResultsJson } from '../../lib/benchmark-results'
import { makeRunner } from '../../lib/BenchmarkRunner'
import { errorsToProcessExit, runSelf } from '../../lib/cli'
import { makeRndPixelData } from '../../lib/generate-test-data'
import { mitataRunner } from '../../lib/mitata'
import { benchGroup, DEFAULT_SEED, log, seed } from '../_args'

type FnOptions = {
  seed?: number,
}

export const extractPixelDataBufferBenchmark = (opts: FnOptions = {}) => {
  const { seed = DEFAULT_SEED } = opts
  const size = 32
  const source = makeRndPixelData(size, size, seed)

  group(`extractPixelDataBuffer from ${size}x${size}`, () => {
    bench('extractPixelDataBuffer rect arg', function* (state: any) {
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
          return source
        },
        [1]() {
          return rect
        },
        bench(src: PixelData, r: Rect) {
          const result = extractPixelDataBufferDist(src, r)

          return do_not_optimize(result)
        },
      }
    })
      .args({
        x: [10],
        y: [10],
        w: [32],
        h: [32],
      })

  })
}

type CommandOptions = Required<FnOptions> & BaseBenchCmdOpts

runSelf(import.meta.url, () => command({
    name: 'extractPixelDataBuffer benchmark',
    args: {
      log,
      group: benchGroup,
      seed,
    },
    handler: async ({ group, log, seed }: CommandOptions) => {
      errorsToProcessExit(() => extractPixelDataBufferBenchmark({ seed }))

      const jsonStr = await mitataRunner({ log })

      await writeBenchResultsJson({
        metaUrl: import.meta.url,
        jsonStr,
        group,
      })
    },
  }),
)

export const runner = makeRunner<CommandOptions>(import.meta.url)
