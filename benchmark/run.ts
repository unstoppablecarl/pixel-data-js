import * as p from '@clack/prompts'
import { command, flag, positional, string } from 'cmd-ts'
import process from 'node:process'
import path from 'path'
import pc from 'picocolors'
import { getCmdCall, makeBar, runSelf } from './lib/cli'
import { makeBarProgressUpdater, runWithProgress } from './lib/cli-progress'
import { findBenchmarkFiles } from './lib/filesystem'
import { benchGroup, log, seed } from './runners/_args'

runSelf(import.meta.url, () => command({
  name: 'run',
  args: {
    target: positional({
      description: `target benchmark`,
      type: string,
    }),
    multi: flag({
      short: 'm',
      long: 'multi',
      description: 'Use *.multi.bench.ts results over *.bench.ts',
      defaultValue: () => false,
      defaultValueIsSerializable: true,
    }),
    group: benchGroup,
    seed,
    log,
  },
  handler: async ({ target, multi, seed, group, log }) => {
    const files = await findBenchmarkFiles(target, multi ? { single: false, multi: true } : undefined)

    if (files.length === 0) {
      console.error(pc.red('No matching benchmark files found.'))
      process.exit(1)
    }

    let targetFile: string
    if (files.length === 1) {
      targetFile = files[0]
    } else {
      targetFile = await p.select({
        message: `Select a benchmark file:`,
        options: files.map(f => {
          const label = path.basename(f)
          return {
            value: f,
            label,
          }
        }),
      }) as string

      if (p.isCancel(targetFile)) {
        p.cancel('Operation cancelled.')
        process.exit(0)
      }
    }

    const bar = makeBar()
    const cmd = await getCmdCall(targetFile)
    const targetCommand = path.basename(targetFile)
      .replace(/\.bench.ts$/, '')
      .replace(/\.multi.bench.ts$/, '')

    bar.start(1, 0, { message: targetCommand })

    await runWithProgress(
      cmd({ seed, group, log, subProcess: true }),
      makeBarProgressUpdater(bar),
    )

    bar.update(bar.getTotal(), { message: 'Complete' })
    bar.stop()
  },
}))
