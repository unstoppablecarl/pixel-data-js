import { Table } from 'console-table-printer'
import type { Task } from 'tinybench'
import { type BlendModeMetadataMap, groupBlendModeTasks, percentDiff, percentDiffString } from '../_helpers'
import { BlendModeReporter } from './BlendModeReporter'

export class BlendModeComparisonReporter extends BlendModeReporter {

  constructor(
    private baseType: string = 'perfect',
    private targetType: string = 'fast',
  ) {
    super()
  }

  print(tasks: Task[], metadataMap: BlendModeMetadataMap) {
    const p = new Table({
      title: `📊 Comparison: ${this.targetType} vs ${this.baseType}`,
      columns: [
        { name: 'blendMode', title: 'Blend Mode', alignment: 'left' },
        { name: 'testCase', title: 'Test Case', alignment: 'left' },

        { name: 'ops_base', title: `${this.baseType} (ops/s)`, alignment: 'right' },
        { name: 'ops_target', title: `${this.targetType} (ops/s)`, alignment: 'right' },
        { name: 'ops_diff', title: '% Diff', alignment: 'right' },

        { name: 'ms_base', title: `${this.baseType} (Avg Latency ms)`, alignment: 'right' },
        { name: 'ms_target', title: `${this.targetType} (Avg Latency ms)`, alignment: 'right' },
        { name: 'ms_diff', title: '% Diff', alignment: 'right' },
      ],
    })

    const groups = groupBlendModeTasks(tasks, metadataMap, this.baseType, this.targetType, (result) => {
      return {
        ops: result.throughput.mean || 0,
        ms: result.latency.mean || 0,
      }
    })

    for (const [_key, data] of groups) {
      const { blendMode, testCase } = data

      const baseData = data[this.baseType]
      const targetData = data[this.targetType]

      const opsBase = baseData.ops
      const opsTarget = targetData.ops
      const opsPercent = percentDiff(opsBase, opsTarget)

      const msBase = baseData.ms
      const msTarget = targetData.ms
      const msPercent = percentDiff(msBase, msTarget)

      p.addRow({
        blendMode,
        testCase,

        ops_base: opsBase.toFixed(2),
        ops_target: opsTarget.toFixed(2),
        ops_diff: percentDiffString(opsPercent),

        ms_base: baseData.ms.toFixed(2),
        ms_target: targetData.ms.toFixed(2),
        ms_diff: percentDiffString(msPercent),
      }, {
        color: opsPercent > 0 ? 'green' : (opsPercent < 0 ? 'red' : 'white'),
      })
    }
    p.printTable()
  }
}
