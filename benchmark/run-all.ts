import { command, option, string } from 'cmd-ts'
import { type CmdCall, getCmdCall, makeBar, runSelf } from './lib/cli'
import { makeBarProgressUpdater, runWithProgress } from './lib/cli-progress'
import { findBenchmarkPairedFiles, type RunnerPair } from './lib/filesystem'
import { benchGroup, log, seed } from './runners/_args'

runSelf(import.meta.url, () => command({
  name: 'run all',
  args: {
    filter: option({
      short: 'f',
      long: 'filter',
      description: `filter by function name`,
      type: string,
      defaultValue: () => '',
    }),
    group: benchGroup,
    seed,
    log,
  },
  handler: async ({ filter, seed, group, log }) => {
    const files = await findBenchmarkPairedFiles(filter)
    const calls = await getCmdCalls(files)

    const bar = makeBar()

    bar.start(calls.length, 0, { message: 'Starting...' })

    for (const fn of calls) {
      await runWithProgress(
        fn({ seed, group, log, subProcess: true }),
        makeBarProgressUpdater(bar),
      )
    }

    bar.update(bar.getTotal(), { message: 'Complete' })
    bar.stop()
  },
}))

async function getCmdCalls(files: RunnerPair[]): Promise<CmdCall[]> {
  const results = []
  for (const { multi, single } of files) {
    const target = multi ?? single
    results.push(await getCmdCall(target))
  }

  return results
}

