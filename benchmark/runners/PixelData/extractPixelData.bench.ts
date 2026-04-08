import type { PixelData } from '@/PixelData/_pixelData-types'
import type { Rect } from '@/Rect/_rect-types'
import { command } from 'cmd-ts'
import { bench, do_not_optimize, group } from 'mitata-ts'
import { extractPixelData as extractPixelDataDist } from '../../../dist/index.prod'
import { mockGlobalImageData } from '../../../support/mockDom'
import type { BaseBenchCmdOpts } from '../../_types'
import { writeBenchResultsJson } from '../../lib/benchmark-results'
import { makeRunner } from '../../lib/BenchmarkRunner'
import { errorsToProcessExit, runSelf } from '../../lib/cli'
import { makeRndPixelData } from '../../lib/generate-test-data'
import { mitataRunner } from '../../lib/mitata'
import { benchGroup, log, seed } from '../_args'

mockGlobalImageData()

type FnOptions = {
  seed?: number,
}
export const extractPixelDataBenchmark = ({ seed }: FnOptions) => {
  const size = 1024

  const source = makeRndPixelData(size, size, seed)

  group(`extractPixelData from ${size}x${size}`, () => {
    bench('object overload', function* (state: any) {
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

      // Prevents Loop Invariant Code Motion
      yield {
        [0]() {
          return source
        },
        [1]() {
          return rect
        },
        bench(src: PixelData, r: Rect) {
          const result = extractPixelDataDist(src, r)

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
  name: 'extractPixelData benchmark',
  args: {
    log,
    group: benchGroup,
    seed,
  },
  handler: async ({ group, log, seed }: CommandOptions) => {
    errorsToProcessExit(() => extractPixelDataBenchmark({ seed }))

    const jsonStr = await mitataRunner({ log })

    await writeBenchResultsJson({
      metaUrl: import.meta.url,
      jsonStr,
      group,
    })
  },
}))

export const runner = makeRunner<CommandOptions>(import.meta.url)
