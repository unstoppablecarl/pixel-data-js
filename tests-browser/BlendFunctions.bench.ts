import prettyMilliseconds from 'pretty-ms'
import { Bench } from 'tinybench'
import { describe, test } from 'vitest'

import { BaseBlendMode, type Color32, makeFastBlendModeRegistry, makePerfectBlendModeRegistry } from '../src'
import type { BlendModeBenchCase, BlendModeMetadataMap } from './reporters/_helpers'
import { BlendModeComparisonReporter } from './reporters/BlendModeReporter/BlendModeComparisonReporter'

describe('Raw Blend Function Performance', () => {
  const size = 1024
  const iterations = size * size

  // Pre-generate random colors to avoid biasing with sequential data
  const srcColors = new Uint32Array(iterations).map(() => (Math.random() * 0xFFFFFFFF) >>> 0)
  const dstColors = new Uint32Array(iterations).map(() => (Math.random() * 0xFFFFFFFF) >>> 0)

  const warmupTime = 1000
  const benchTime = 3000

  const bench = new Bench({
    time: benchTime,
    warmupTime: warmupTime,
  })

  function makeComparison() {
    const reporter = new BlendModeComparisonReporter()
    reporter.setupListeners(bench)

    const fastReg = makeFastBlendModeRegistry()
    const perfectReg = makePerfectBlendModeRegistry()

    const cases: BlendModeBenchCase[] = []

    fastReg.indexToBlend
      .filter((_blendFn, index) => index === BaseBlendMode.sourceOver)
      .forEach((blendFn, index) => {
        const blendMode = fastReg.blendToName.get(blendFn)!
        const perfectFn = perfectReg.indexToBlend[index]

        // Add Fast Case
        cases.push({
          type: 'fast',
          blendMode,
          testCase: 'raw loop',
          run: () => {
            for (let i = 0; i < iterations; i++) {
              // Sink the result to prevent dead code elimination
              globalThis.lastResult = blendFn(srcColors[i] as Color32, dstColors[i] as Color32)
            }
          },
        })

        // Add Perfect Case
        cases.push({
          type: 'perfect',
          blendMode,
          testCase: 'raw loop',
          run: () => {
            for (let i = 0; i < iterations; i++) {
              globalThis.lastResult = perfectFn(srcColors[i] as Color32, dstColors[i] as Color32)
            }
          },
        })
      })

    return {
      cases,
      reporter,
    }
  }

  const { cases, reporter } = makeComparison()
  const timeout = cases.length * (benchTime + warmupTime)

  console.info('Starting Raw Math Bench: estimated time: ' + prettyMilliseconds(timeout))

  test('Direct Function Call Bench', async () => {
    const metadataMap: BlendModeMetadataMap = new Map()
    cases.forEach(({ blendMode, testCase, type, run }) => {
      const taskName = `${type}: ${blendMode} - ${testCase}`
      bench.add(taskName, run)
      metadataMap.set(taskName, {
        type,
        blendMode,
        testCase,
      })
    })

    await bench.run()
    reporter.print(bench.tasks, metadataMap)
  }, timeout + 5000)
})

// Prevent V8 from optimizing away the loop by "using" the return value
declare global {
  var lastResult: number
}
