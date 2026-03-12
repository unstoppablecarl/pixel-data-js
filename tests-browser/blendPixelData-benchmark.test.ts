import prettyMilliseconds from 'pretty-ms'
import { Bench } from 'tinybench'
import { describe, test } from 'vitest'

import {
  type AlphaMask,
  type BinaryMask,
  type BlendColor32,
  type BlendModeRegistry,
  blendPixelData,
  makeFastBlendModeRegistry,
  makePerfectBlendModeRegistry, MaskType,
  PixelData,
} from '../src'
import { makeComplexAlphaMask, makeComplexBinaryMask, makeComplexTestPixelData } from '../tests/_helpers'
import { ComparisonReporter } from './reporters/ComparisonReporter'
import { SummaryReporter } from './reporters/SummaryReporter'

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

  function makeFastSummary(blendName: string) {
    const reporter = new SummaryReporter(size, size)
    reporter.setupListeners(bench)

    const fastReg = makeFastBlendModeRegistry()
    const cases = buildBlendModeCases('fast', fastReg, src, dst, binaryMask, alphaMask, fastReg.nameToBlend[blendName as typeof fastReg.nameType]!)

    return {
      cases,
      reporter,
    }
  }

  function makeComparison(blendName: string) {
    // const reporter = new SummaryReporter(size, size)
    const reporter = new ComparisonReporter(size, size, 'perfect', 'fast')
    reporter.setupListeners(bench)

    const fastReg = makeFastBlendModeRegistry()
    const fastCases = buildBlendModeCases('fast', fastReg, src, dst, binaryMask, alphaMask, fastReg.nameToBlend[blendName as typeof fastReg.nameType]!)
    const perfectReg = makePerfectBlendModeRegistry()
    const perfectCases = buildBlendModeCases('perfect', perfectReg, src, dst, binaryMask, alphaMask, perfectReg.nameToBlend[blendName as typeof perfectReg.nameType]!)

    const cases = [...fastCases, ...perfectCases]

    return {
      cases,
      reporter,
    }
  }

  const { cases, reporter } = makeComparison('sourceOver')
  // const { cases, reporter } = makeFastSummary('sourceOver')

  const timeout = cases.length * (benchTime + warmupTime)

  console.info('Starting: estimated time: ' + prettyMilliseconds(timeout))

  const metadataMap = new Map<string, any>()

  test('Blend Mode Bench', async () => {
    cases.forEach(({ name, testCase, type, run }) => {
      const taskName = `${type}: ${name} - ${testCase}`
      bench.add(taskName, run)
      metadataMap.set(taskName, { type, name, testCase })
    })
    await bench.run()

    reporter.print(bench.tasks, metadataMap)
  }, timeout + 5000)
})

type Case = {
  name: string
  testCase: string
  type: string
  run: () => void
};

function _buildAllCases(
  label: string,
  registry: BlendModeRegistry,
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
): Case[] {

  return registry.indexToBlend.flatMap((blendFn) => {
    return buildBlendModeCases(
      label,
      registry,
      src,
      dst,
      binaryMask,
      alphaMask,
      blendFn,
    )
  })
}

function buildBlendModeCases(
  type: string,
  registry: BlendModeRegistry,
  src: PixelData,
  dst: PixelData,
  binaryMask: BinaryMask,
  alphaMask: AlphaMask,
  blendFn: BlendColor32,
): Case[] {

  const cases = []
  const name = registry.blendToName.get(blendFn)!

  const base = {
    name,
    type,
  }

  cases.push({
    ...base,
    testCase: `minimal`,
    run: () => {
      blendPixelData(dst, src, {
        blendFn,
      })
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
    },
  })

  return cases
}

