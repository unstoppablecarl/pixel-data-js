import { type Context, type Result, run as mitataRun, type Trial } from 'mitata-ts'
import type { BenchRun } from '../_types'

export function prepareMitataResults(results: {
                                       layout: []
                                       context: Context
                                       benchmarks: Trial[]
                                     },
) {
  console.log(results)
  if (results.context?.noop?.fn?.samples) {
    // @ts-expect-error
    results.context.noop.fn.samples = undefined
  }

  if (results.context?.noop?.iter?.samples) {
    // @ts-expect-error
    results.context.noop.iter.samples = undefined
  }

  if (results.context?.noop?.fn_gc?.samples) {
    // @ts-expect-error
    results.context.noop.fn_gc.samples = undefined
  }

  results.benchmarks = results.benchmarks.map(b => {
    b.runs = b.runs.map(r => {
      // @ts-expect-error
      r.stats.samples = undefined

      return r
    })
    return b
  })

  return results
}

export type ParsedMitataResult = Map<string, BenchRun>

export function parseMitataResultJson(raw: Result): ParsedMitataResult {
  const map = new Map<string, BenchRun>()
  const groupsByIndex = raw.layout.map((v) => v.name)

  for (const b of raw.benchmarks) {
    const alias = b.alias ?? ''
    const groupName = groupsByIndex[b.group] ?? ''
    const isMultiRun = b.runs.length > 1

    for (let i = 0; i < b.runs.length; i++) {
      const r = b.runs[i]
      const stats = r.stats
      if (!stats?.avg) continue

      const runName = r.name ?? ''

      const argsKey = Object.entries(r.args as Record<string, any>).map(([key, value]) => `${key}=${JSON.stringify(value)}`)

      const id = [groupName, alias, runName, argsKey]
        .filter(v => v)
        .join('-')

      const slug = [groupName, alias, runName]
        .filter(v => v)
        .join('-')

      map.set(id, {
        id,
        slug,
        groupName,
        alias,
        runName,
        isMultiRun,
        args: r.args,
        runIndex: i,
        avg: stats.avg,
        min: stats.min,
        max: stats.max,
        p25: stats.p25,
        p50: stats.p50,
        p75: stats.p75,
        p99: stats.p99,
        p999: stats.p999,
        heap: stats.heap,
      })
    }
  }

  return map
}

type MitataRunnerOpts = Omit<Parameters<typeof mitataRun>[0], 'format'> & {
  log?: boolean
}

export async function mitataRunner(opts: MitataRunnerOpts = {}) {
  const { log = false, ...options } = opts

  const results = await mitataRun({
    throw: true,
    ...options,
    format: log ? 'mitata' : 'quiet',
  }) as Result

  return mitataResultToJson(results)
}

export function mitataResultToJson(result: Result) {
  return JSON.stringify(result,
    (k, v) => {
      if (k === 'debug') return ''
      if (k === 'samples') return null

      if (!(v instanceof Error)) return v
      return { message: String(v.message), stack: v.stack }
    }, 0)

}
