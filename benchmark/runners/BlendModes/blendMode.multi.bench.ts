import { BaseBlendMode } from '@/BlendModes/blend-modes'
import { makeFastBlendModeRegistry } from '@/BlendModes/blend-modes-fast'
import { makePerfectBlendModeRegistry } from '@/BlendModes/blend-modes-perfect'
import { command } from 'cmd-ts'

import type { BaseBenchCmdOpts, BlendModeType } from '../../_types'
import type { BenchmarkRunner } from '../../lib/BenchmarkRunner'
import { cmd, runSelf } from '../../lib/cli'
import { reportProgress } from '../../lib/cli-progress'
import { fileExists } from '../../lib/filesystem'
import { benchGroup, iterations, log, seed } from '../_args'
import { runner as blendPixelDataRunner } from '../PixelData/blendPixelData.bench'
import { callBlendModeBenchmark } from './blendMode.bench'

type CommandOptions = BaseBenchCmdOpts & {
  iterations: number
}

runSelf(import.meta.url, () => command({
  name: 'blend-modes',
  description: 'Benchmark all blend modes',
  args: {
    iterations,
    seed,
    log,
    group: benchGroup,
  },
  handler: async ({ iterations, seed, group, log }: CommandOptions) => {
    const cases = await getCases(group)
    reportProgress({ total: cases.length })

    for (let i = 0; i < cases.length; i++) {

      const c = cases[i]
      const { type, blendModeName: blend } = c

      reportProgress({ step: i, message: type + ' - ' + blend })
      await callBlendModeBenchmark({ blend, type, iterations, seed, group, log })
    }
  },
}))

type Case = {
  type: BlendModeType,
  blendModeName: string,
}

async function getCases(group?: string) {
  const runners: Case[] = []
  const fastRegistry = makeFastBlendModeRegistry()
  const perfectRegistry = makePerfectBlendModeRegistry()

  Object.values(BaseBlendMode)
    .forEach((blendIndex) => {
      runners.push({
        type: 'fast',
        blendModeName: fastRegistry.indexToName[blendIndex],
      })
      runners.push({
        type: 'perfect',
        blendModeName: perfectRegistry.indexToName[blendIndex],
      })
    })

  const checks = await Promise.all(
    runners.map(async (c) => {
      const filePath = await blendPixelDataRunner.outputFilePath({
        group,
        type: c.type,
        blendName: c.blendModeName,
      })

      const exists = await fileExists(filePath)
      return exists ? null : c
    }),
  )

  return checks.filter((c): c is Case => c !== null)
}

export const runner: BenchmarkRunner<CommandOptions> = {
  cmdCall: cmd<CommandOptions>(import.meta.url),
}
