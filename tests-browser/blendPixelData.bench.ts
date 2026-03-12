import prettyMilliseconds from 'pretty-ms'
import { Bench } from 'tinybench'
import { describe, test } from 'vitest'

import {
  type AlphaMask,
  BaseBlendMode,
  type BinaryMask,
  type BlendColor32,
  type BlendModeRegistry,
  blendPixelData,
  makeFastBlendModeRegistry,
  makePerfectBlendModeRegistry,
  MaskType,
  PixelData,
} from '../src'
import { makeComplexAlphaMask, makeComplexBinaryMask, makeComplexTestPixelData } from '../tests/_helpers'
import type { BlendModeBenchCase, BlendModeMetadataMap, BlendModeType } from './reporters/_helpers'
import { BlendPixelDataComparisonReporter } from './reporters/BlendPixelDataReporter/BlendPixelDataComparisonReporter'
import { BlendPixelDataSummaryReporter } from './reporters/BlendPixelDataReporter/BlendPixelDataSummaryReporter'

describe('Blend Modes', () => {
  const size = 1024
  const src = makeComplexTestPixelData(size, size)
  const dst = makeComplexTestPixelData(size, size)
  const alphaMask = makeComplexAlphaMask(size, size)
  const binaryMask = makeComplexBinaryMask(size, size)

  const warmupTime = 1000
  const benchTime = 3000

  const bench = new Bench({
    time: benchTime,
    warmupTime: warmupTime,
  })

  function makeCases(type: BlendModeType, registry: BlendModeRegistry, blendIndex: number) {
    const blendName = registry.indexToName[blendIndex]!
    const blendFn = registry.indexToBlend[blendIndex]!

    return buildBlendModeCases(type, blendName, blendFn, src, dst, binaryMask, alphaMask)
  }

  function makeSummary(type: BlendModeType, registry: BlendModeRegistry, blendIndex: number) {
    const reporter = new BlendPixelDataSummaryReporter(size, size)
    reporter.setupListeners(bench)

    return {
      cases: makeCases(type, registry, blendIndex),
      reporter,
    }
  }

  function makeFastSummary(blendIndex: number) {
    return makeSummary('fast', makeFastBlendModeRegistry(), blendIndex)
  }

  function makePerfectSummary(blendIndex: number) {
    return makeSummary('perfect', makePerfectBlendModeRegistry(), blendIndex)
  }

  function makeComparison(blendIndex: number) {
    const reporter = new BlendPixelDataComparisonReporter(size, size, 'perfect', 'fast')
    reporter.setupListeners(bench)

    const fastReg = makeFastBlendModeRegistry()
    const fastCases = makeCases('fast', fastReg, blendIndex)

    const perfectReg = makePerfectBlendModeRegistry()
    const perfectCases = makeCases('perfect', perfectReg, blendIndex)

    return {
      cases: [...fastCases, ...perfectCases],
      reporter,
    }
  }

  // const { cases, reporter } = makeComparison(BaseBlendMode.sourceOver)
  const { cases, reporter } = makeFastSummary(BaseBlendMode.sourceOver)

  const timeout = cases.length * (benchTime + warmupTime)

  console.info('Starting: estimated time: ' + prettyMilliseconds(timeout))

  test('Blend Mode Bench', async () => {
    const metadataMap: BlendModeMetadataMap = new Map()
    cases.forEach(({ blendMode, testCase, type, run }) => {
      const taskName = `${type}: ${blendMode} - ${testCase}`
      bench.add(taskName, run)
      metadataMap.set(taskName, { type, blendMode, testCase })
    })
    await bench.run()

    reporter.print(bench.tasks, metadataMap)
  }, timeout + 5000)
})

function _buildAllCases(
  type: BlendModeType,
  registry: BlendModeRegistry,
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
): BlendModeBenchCase[] {

  return registry.indexToBlend.flatMap((blendFn) => {

    const blendName = registry.blendToName.get(blendFn)!

    return buildBlendModeCases(
      type,
      blendName,
      blendFn,
      src,
      dst,
      binaryMask,
      alphaMask,
    )
  })
}

function buildBlendModeCases(
  type: BlendModeType,
  blendMode: string,
  blendFn: BlendColor32,
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
): BlendModeBenchCase[] {

  const cases: BlendModeBenchCase[] = []

  const base = {
    blendMode,
    type,
  }

  cases.push({
    ...base,
    testCase: `minimal`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Global Alpha`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        alpha: 128,
      })
      globalThis.lastResult = dst
    },
  })

  // --- Masking Logic ---

  cases.push({
    ...base,
    testCase: `Binary Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: binaryMask,
        maskType: MaskType.BINARY,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
      })
      globalThis.lastResult = dst
    },
  })

  // --- Inversion and Alpha Combinations ---

  cases.push({
    ...base,
    testCase: `Alpha Mask (Inverted)`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Alpha + Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        alpha: 128,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
      })
      globalThis.lastResult = dst
    },
  })

  // --- Coordinate & Offset Stress Tests ---

  cases.push({
    ...base,
    testCase: `Sub-region 512x512`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        x: 100,
        y: 100,
        w: 512,
        h: 512,
        sx: 50,
        sy: 50,
      })
      globalThis.lastResult = dst
    },
  })

  cases.push({
    ...base,
    testCase: `Sub-region 512x512 + Offset Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        x: 100,
        y: 100,
        w: 512,
        h: 512,
        sx: 50,
        sy: 50,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        mx: 20,
        my: 20,
        mw: 1024,
      })
      globalThis.lastResult = dst
    },
  })

  // Tests logic where the mask is not a 1:1 fit for the source/dest
  cases.push({
    ...base,
    testCase: `Offset Alpha Mask`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        mx: 20,
        my: 20,
        mw: 1024,
      })
      globalThis.lastResult = dst
    },
  })

  // Worst-case scenario: heavy math + alpha scaling + mask + inversion
  cases.push({
    ...base,
    testCase: `Full Stack (Alpha/Mask/Invert)`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
        alpha: 128,
        mask: alphaMask,
        maskType: MaskType.ALPHA,
        invertMask: true,
      })
      globalThis.lastResult = dst
    },
  })

  return cases
}

// Prevent V8 from optimizing away the loop by "using" the return value
declare global {
  var lastResult: PixelData
}
