#!/usr/bin/env tsx

import { type ctx, run, type trial } from 'mitata'
import { pixelDataBenchmarkBuilder } from './benchmarks/blendPixelData-benchmark'

import { blendPixelData } from '../dist/index.prod'

pixelDataBenchmarkBuilder(blendPixelData as any)

const outputFile = process.env.BENCH_OUTPUT
if (!outputFile) {
  console.error('no BENCH_OUTPUT set')
  process.exit(1)
}

const results = await run({
  colors: false,
})

const { writeFileSync, mkdirSync } = await import('fs')
const { dirname } = await import('path')
const finalResults = processResults(results)

mkdirSync(dirname(outputFile), { recursive: true })
writeFileSync(outputFile, JSON.stringify(finalResults, null, 2))
console.log(`Results written to ${outputFile}`)

function processResults(
  results: {
    context: ctx
    benchmarks: trial[]
  },
) {
  // @ts-expect-error
  results.context.noop.fn.samples = undefined
  // @ts-expect-error
  results.context.noop.iter.samples = undefined
  // @ts-expect-error
  results.context.noop.fn_gc.samples = undefined

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
