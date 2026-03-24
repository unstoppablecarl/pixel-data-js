import { command, option, positional, string } from 'cmd-ts'
import process from 'node:process'
import path from 'path'
import p from 'picocolors'
import { BENCH_RESULTS_DIR } from './bench.config'
import { loadBenchResultsJson } from './lib/benchmark-results'
import { runSelf } from './lib/cli'
import { dirExists } from './lib/filesystem'
import { type ParsedMitataResult } from './lib/mitata'
import { printComparison } from './lib/printComparison'

runSelf(import.meta.url, () => command({
  name: 'compare',
  args: {
    base: positional({
      displayName: 'base',
      description: `folder name in ${BENCH_RESULTS_DIR}`,
      type: string,
    }),
    target: positional({
      displayName: 'target',
      description: `folder name in ${BENCH_RESULTS_DIR}`,
      type: string,
    }),
    filter: option({
      long: 'filter',
      short: 'f',
      description: `filter by name contents`,
      type: string,
      defaultValue: () => '',
    }),
  },
  handler: async ({ base, target, filter }) => {
    const { basePath, targetPath } = await getDirs(base, target)
    const results = await loadBenchResultsJson(basePath, targetPath)

    const baseInput = results.map(({ baseData }) => baseData)
    const targetInput = results.map(({ targetData }) => targetData)

    const allBaseData = mergeResults(baseInput, filter)
    const allTargetData = mergeResults(targetInput, filter)

    printComparison({
      base,
      target,
      baseData: allBaseData,
      targetData: allTargetData,
    })
  },
}))

async function getDirs(base: string, target: string) {
  const basePath = path.join(BENCH_RESULTS_DIR, base)
  const targetPath = path.join(BENCH_RESULTS_DIR, target)

  if (!(await dirExists(basePath))) {
    console.error(p.red('ERROR'), `base: '${base}' does not exist in ${BENCH_RESULTS_DIR}`)
    process.exit(1)
  }

  if (!(await dirExists(targetPath))) {
    console.error(p.cyan('ERROR'), `target: '${target}' does not exist in ${BENCH_RESULTS_DIR}`)
    process.exit(1)
  }

  return {
    basePath,
    targetPath,
  }
}

function mergeResults(resultData: (ParsedMitataResult | null)[], filter?: string | null) {
  const result: ParsedMitataResult = new Map()

  resultData
    .forEach((item) => {
      item?.forEach((benchRun, key) => {
        if (!filter || benchRun.slug.includes(filter)) result.set(key, benchRun)
      })
    })

  return result
}
