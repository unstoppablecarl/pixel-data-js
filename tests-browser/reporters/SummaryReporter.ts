import { Table } from 'console-table-printer'
import { BaseBenchReporter, type MetadataMap } from './BaseBenchReporter'

export class SummaryReporter extends BaseBenchReporter {
  print(tasks: any[], metadataMap: MetadataMap) {
    const p = new Table({
      title: '📊 Performance Summary',
      columns: [
        { name: 'type', title: 'Type', alignment: 'left' },
        { name: 'mode', title: 'Mode', alignment: 'left' },
        { name: 'testCase', title: 'Test Case', alignment: 'left' },
        { name: 'mpps', title: 'MP/s', alignment: 'right' },
      ],
    })

    for (const task of tasks) {
      const result = task.result
      if (!result) continue

      const mpps = result.throughput.mean * this.megapixels
      const { type, name, testCase } = metadataMap.get(task.name)!

      p.addRow({
        type,
        mode: name,
        testCase,
        mpps: `${mpps.toFixed(2)}`,
      }, {
        color: mpps > 200 ? 'green' : 'yellow',
      })
    }
    p.printTable()
  }
}
