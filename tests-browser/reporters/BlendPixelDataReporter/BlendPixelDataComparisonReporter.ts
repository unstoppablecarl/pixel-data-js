import { Table } from 'console-table-printer'
import type { Task } from 'tinybench'
import { type BlendModeMetadataMap, groupBlendModeTasks, percentDiff, percentDiffString } from '../_helpers'
import { BlendPixelDataReporter } from './BlendPixelDataReporter'

export class BlendPixelDataComparisonReporter extends BlendPixelDataReporter {
  constructor(
    width: number,
    height: number,
    private baseType: string = 'perfect',
    private targetType: string = 'fast',
  ) {
    super(width, height)
  }

  print(tasks: Task[], metadataMap: BlendModeMetadataMap) {
    const p = new Table({
      title: `📊 Comparison: ${this.targetType} vs ${this.baseType}`,
      columns: [
        { name: 'blendMode', title: 'Blend Mode', alignment: 'left' },
        { name: 'testCase', title: 'Test Case', alignment: 'left' },

        { name: 'mps_base', title: `${this.baseType} (MP/s)`, alignment: 'right' },
        { name: 'mps_target', title: `${this.targetType} (MP/s)`, alignment: 'right' },
        { name: 'mps_diff', title: '% Diff', alignment: 'right' },

        { name: 'ms_base', title: `${this.baseType} (Avg Latency ms)`, alignment: 'right' },
        { name: 'ms_target', title: `${this.targetType} (Avg Latency ms)`, alignment: 'right' },
        { name: 'ms_diff', title: '% Diff', alignment: 'right' },
      ],
    })

    const groups = groupBlendModeTasks(tasks, metadataMap, this.baseType, this.targetType, (result) => {
      const hz = result.throughput.mean || 0
      const mps = hz * this.megapixels
      const ms = result.latency.mean || 0

      return {
        mps,
        ms,
      }
    })

    for (const [_key, data] of groups) {
      const { blendMode, testCase } = data

      const baseData = data[this.baseType]
      const targetData = data[this.targetType]

      const mpsBase = baseData.mps
      const mpsTarget = targetData.mps
      const mpsPercent = percentDiff(mpsBase, mpsTarget)

      const msBase = baseData.ms
      const msTarget = targetData.ms
      const msPercent = percentDiff(msBase, msTarget)

      p.addRow({
        blendMode,
        testCase,

        mps_base: mpsBase.toFixed(2),
        mps_target: mpsTarget.toFixed(2),
        mps_diff: percentDiffString(mpsPercent),

        ms_base: msBase.toFixed(2),
        ms_target: msTarget.toFixed(2),
        ms_diff: percentDiffString(msPercent),
      }, {
        color: mpsPercent > 0 ? 'green' : (mpsPercent < 0 ? 'red' : 'white'),
      })
    }
    p.printTable()
  }
}
