import { Table } from 'console-table-printer'
import type { Task } from 'tinybench'
import { type BlendModeMetadataMap, taskResultComplete } from '../_helpers'
import { BlendPixelDataReporter } from './BlendPixelDataReporter'

export class BlendPixelDataSummaryReporter extends BlendPixelDataReporter {

  print(tasks: Task[], metadataMap: BlendModeMetadataMap) {
    const p = new Table({
      title: '📊 Performance Summary',
      columns: [
        { name: 'type', title: 'Type', alignment: 'left' },
        { name: 'blendMode', title: 'Blend Mode', alignment: 'left' },
        { name: 'testCase', title: 'Test Case', alignment: 'left' },
        { name: 'mps', title: this.primaryUnitLabel, alignment: 'right' },
        { name: 'ms', title: `Avg Latency ms`, alignment: 'right' },
      ],
    })

    for (const task of tasks) {
      const result = task.result
      if (!taskResultComplete(result)) continue

      const mps = this.resultToPrimaryValue(result)
      const { type, blendMode, testCase } = metadataMap.get(task.name)!

      p.addRow({
        type,
        blendMode,
        testCase,
        mps: `${mps.toFixed(2)}`,
        ms: result.throughput.mean.toFixed(2),
      }, {
        color: mps > 200 ? 'green' : 'yellow',
      })
    }
    p.printTable()
  }
}
