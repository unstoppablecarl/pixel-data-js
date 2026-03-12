import { Table } from 'console-table-printer'
import { BaseBenchReporter, type MetadataMap } from './BaseBenchReporter'

export class ComparisonReporter extends BaseBenchReporter {
  constructor(
    width: number,
    height: number,
    private baseType: string = 'perfect',
    private targetType: string = 'fast',
  ) {
    super(width, height)
  }

  print(tasks: any[], metadataMap: MetadataMap) {
    const p = new Table({
      title: `📊 Comparison: ${this.targetType} vs ${this.baseType}`,
      columns: [
        { name: 'mode', title: 'Blend Mode', alignment: 'left' },
        { name: 'testCase', title: 'Test Case', alignment: 'left' },

        { name: 'mps_base', title: `${this.baseType} (MP/s)`, alignment: 'right' },
        { name: 'mps_target', title: `${this.targetType} (MP/s)`, alignment: 'right' },
        { name: 'mps_diff', title: '% Diff', alignment: 'right' },

        { name: 'ms_base', title: `${this.baseType} (Avg Latency ms)`, alignment: 'right' },
        { name: 'ms_target', title: `${this.targetType} (Avg Latency ms)`, alignment: 'right' },
        { name: 'ms_diff', title: '% Diff', alignment: 'right' },
      ],
    })

    const groups = new Map<string, Record<string, { mps: number, ms: number }>>()

    for (const task of tasks) {
      const result = task.result
      if (!result) continue

      const { type, name, testCase } = metadataMap.get(task.name)!
      const key = `${name}::${testCase}`

      if (!groups.has(key)) groups.set(key, {})

      const hz = result.throughput.mean
      const mps = hz * this.megapixels
      const ms = result.latency.mean

      groups.get(key)![type] = {
        mps,
        ms,
      }
    }

    for (const [key, data] of groups) {
      const [mode, testCase] = key.split('::')
      const baseData = data[this.baseType]
      const targetData = data[this.targetType]

      const mpsBase = baseData.mps || 0
      const mpsTarget = targetData.mps || 0
      const mpsPercent = toPercent(mpsBase, mpsTarget)

      const msBase = baseData.ms || 0
      const msTarget = targetData.ms || 0
      const msPercent = toPercent(msBase, msTarget)

      p.addRow({
        mode,
        testCase,

        mps_base: mpsBase.toFixed(2),
        mps_target: mpsTarget.toFixed(2),
        mps_diff: percentString(mpsPercent),

        ms_base: baseData.ms.toFixed(2),
        ms_target: targetData.ms.toFixed(2),
        ms_diff: percentString(msPercent),
      }, {
        color: mpsPercent > 0 ? 'green' : (mpsPercent < 0 ? 'red' : 'white'),
      })
    }
    p.printTable()
  }
}

function toPercent(a: number, b: number) {
  return a !== 0 ? ((b - a) / a) * 100 : 0
}

function percentString(val: number) {
  return `${val >= 0 ? '+' : ''}${val.toFixed(1)}%`
}
