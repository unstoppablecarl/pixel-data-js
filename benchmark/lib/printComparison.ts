import p from 'picocolors'
import { Table } from 'console-table-printer'
import type { BenchRun } from '../_types'
import { THRESHOLD_GOOD, THRESHOLD_WARN } from '../bench.config'
import { formatBytes, formatDelta, formatNs, formatSpeedup } from './formaters'
import type { ParsedMitataResult } from './mitata'

export function printComparison(
  {
    base,
    target,
    baseData,
    targetData,
    prependGroupNameToRow = false,
    appendArgs = true,
  }: {
    base: string
    target: string
    baseData: ParsedMitataResult
    targetData: ParsedMitataResult
    prependGroupNameToRow?: boolean
    appendArgs?: boolean
  },
) {
  const allIds = new Set([...baseData.keys(), ...targetData.keys()])
  const groups = new Map<string, ReturnType<typeof createRow>[]>()

  // 1. Group the data first
  for (const id of allIds) {
    const baseRun = baseData.get(id)
    const targetRun = targetData.get(id)
    if (!baseRun && !targetRun) continue

    const groupName = baseRun?.groupName ?? targetRun?.groupName ?? 'default'
    const row = createRow(
      baseRun,
      targetRun,
    )

    if (!groups.has(groupName)) {
      groups.set(groupName, [])
    }
    groups.get(groupName)!.push(row)
  }

  let totalRegressions = 0
  let totalImprovements = 0

  for (const [groupName, rows] of groups) {
    const pTable = new Table({
      columns: [
        {
          name: 'name',
          title: p.yellow(`${groupName} (${base} vs ${target})`),
          alignment: 'left',
        },
        ...columns,
      ],
    })

    for (const { row, isRegression, isImprovement } of rows) {
      pTable.addRow(row)
      if (isRegression) totalRegressions++
      if (isImprovement) totalImprovements++
    }

    console.log()
    pTable.printTable()
  }

  printSummary(totalRegressions, totalImprovements)

  function createRow(base?: BenchRun, target?: BenchRun) {
    let baseAvgStr = p.gray('missing')
    let targetAvgStr = p.gray('missing')
    let deltaAvgStr = p.gray('—')
    let baseHeapStr = p.gray('—')
    let targetHeapStr = p.gray('—')
    let deltaHeapStr = p.gray('—')
    let summaryStr = p.gray('—')
    let isRegression = false
    let isImprovement = false

    if (base) {
      baseAvgStr = formatNs(base.avg)
      if (base.heap) baseHeapStr = formatBytes(base.heap.avg)
    }

    if (target) {
      targetAvgStr = formatNs(target.avg)
      if (target.heap) targetHeapStr = formatBytes(target.heap.avg)
    }

    if (base && target) {
      const ratioAvg = getRatio(base.avg, target.avg)
      deltaAvgStr = formatDelta(ratioAvg)
      summaryStr = formatSpeedup(target.avg / base.avg)

      if (ratioAvg > THRESHOLD_WARN) isRegression = true
      if (ratioAvg < -THRESHOLD_GOOD) isImprovement = true

      if (base.heap && target.heap) {
        const ratioHeap = getRatio(base.heap.avg, target.heap.avg)
        deltaHeapStr = formatDelta(ratioHeap)
      }
    } else if (base) {
      summaryStr = p.gray('removed')
    } else if (target) {
      summaryStr = p.gray('new')
    }

    const name = displayName(base) ?? displayName(target) ?? 'unknown'

    return {
      isRegression,
      isImprovement,
      row: {
        name: p.cyan(name),
        baseAvg: baseAvgStr,
        compAvg: targetAvgStr,
        deltaAvg: deltaAvgStr,
        baseHeap: baseHeapStr,
        compHeap: targetHeapStr,
        deltaHeap: deltaHeapStr,
        summary: summaryStr,
      },
    }
  }

  function displayName(benchRun?: BenchRun) {
    if (!benchRun) return null

    const alias = benchRun.alias
    const groupName = prependGroupNameToRow ? benchRun.groupName : null

    const parts = [groupName, alias]
    let runName = benchRun.runName

    if (alias !== runName) {
      parts.push(runName)
    }
    if (appendArgs) {
      const args = Object.entries(benchRun.args)
        .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
        .join(' ')

      parts.push(args)
    } else if (benchRun.isMultiRun) {
      parts.push(`#${benchRun.runIndex + 1}`)
    }

    return parts.filter(v => v).join(' - ')
  }
}

function printSummary(regressions: number, improvements: number) {
  console.log()
  if (regressions > 0) {
    const threshold = (THRESHOLD_WARN * 100).toFixed(0)
    console.log(p.red(`⚠  ${regressions} regression(s) detected (>${threshold}% slower)`))
  } else {
    console.log(p.green('✓  No regressions detected'))
  }

  if (improvements > 0) {
    console.log(p.green(`🚀 ${improvements} improvement(s) detected`))
  }
  console.log()
}

function getRatio(baseVal: number, compVal: number): number {
  return (compVal - baseVal) / baseVal
}

const columns = [
  {
    name: 'baseAvg',
    title: 'ms/iter B',
    alignment: 'right',
  },
  {
    name: 'compAvg',
    title: 'T',
    alignment: 'right',
  },
  {
    name: 'deltaAvg',
    title: 'Δ',
    alignment: 'right',
  },
  {
    name: 'baseHeap',
    title: 'Heap B',
    alignment: 'right',
  },
  {
    name: 'compHeap',
    title: 'T',
    alignment: 'right',
  },
  {
    name: 'deltaHeap',
    title: 'Δ',
    alignment: 'right',
  },
  {
    name: 'summary',
    title: 'Speed',
    alignment: 'left',
  },
]
