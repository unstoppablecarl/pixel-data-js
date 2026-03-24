import { BaseBlendMode } from '@/BlendModes/blend-modes'
import { command } from 'cmd-ts'
import type { BaseBenchCmdOpts, BlendModeType } from '../../_types'
import type { BenchmarkRunner } from '../../lib/BenchmarkRunner'
import { cmd, runSelf } from '../../lib/cli'
import { reportProgress } from '../../lib/cli-progress'
import { fileExists } from '../../lib/filesystem'
import { benchGroup, log, seed } from '../_args'
import { callBlendPixelDataBenchmark, runner as blendPixelDataRunner } from './blendPixelData.bench'

type CommandOptions = BaseBenchCmdOpts

runSelf(import.meta.url, () => command({
  name: 'blend-pixel-data-multi',
  description: 'Benchmark pixel data blending performance',
  args: {
    seed,
    group: benchGroup,
    log,
  },
  handler: async ({ group, log, seed }: CommandOptions) => {
    const cases = await getCases(group)

    reportProgress({ total: cases.length, step: 0, message: 'blendPixelData: Starting...' })

    for (let i = 0; i < cases.length; i++) {
      const { type, blendName } = cases[i]

      reportProgress({ message: `blendPixelData: ${type} - ${blendName}` })
      await callBlendPixelDataBenchmark({
        group,
        blend: blendName,
        type,
        log,
        seed,
        subProcess: true,
      })
      reportProgress({ step: i })

    }
  },
}))

type Case = { type: BlendModeType, blendName: string }

async function getCases(group?: string): Promise<Case[]> {
  const blendNames = Object.keys(BaseBlendMode)

  const cases: Case[] = blendNames.flatMap(blendName => {
    return [
      {
        type: 'fast',
        blendName,
      },
      {
        type: 'perfect',
        blendName,
      },
    ]
  })

  const checks = await Promise.all(
    cases.map(async (c) => {
      const filePath = await blendPixelDataRunner.outputFilePath({
        group,
        type: c.type,
        blendName: c.blendName,
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
