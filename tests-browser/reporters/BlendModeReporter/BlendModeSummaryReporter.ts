import { Table } from 'console-table-printer'
import type { Task } from 'tinybench'
import { type BlendModeMetadataMap, taskResultComplete } from '../_helpers'
import { BlendModeReporter } from './BlendModeReporter'

export class BlendModeSummaryReporter extends BlendModeReporter {

  print(tasks: Task[], metadataMap: BlendModeMetadataMap) {
    const p = new Table({
      title: '📊 Performance Summary',
      columns: [
        { name: 'type', title: 'Type', alignment: 'left' },
        { name: 'blendMode', title: 'Blend Mode', alignment: 'left' },
        { name: 'testCase', title: 'Test Case', alignment: 'left' },
        { name: 'ops', title: this.primaryUnitLabel, alignment: 'right' },
      ],
    })

    for (const task of tasks) {
      const result = task.result
      if (!taskResultComplete(result)) continue

      const ops = this.resultToPrimaryValue(result)
      const { type, blendMode, testCase } = metadataMap.get(task.name)!

      p.addRow({
        type,
        blendMode,
        testCase,
        ops: `${ops.toFixed(2)}`,
      }, {
        color: ops > 200 ? 'green' : 'yellow',
      })
    }
    p.printTable()
  }
}
