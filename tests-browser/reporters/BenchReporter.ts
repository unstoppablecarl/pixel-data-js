import type { Bench, Task, TaskResultWithStatistics } from 'tinybench'
import { type BlendModeMetadataMap, taskResultComplete } from './_helpers'

export abstract class BenchReporter {
  protected abstract primaryUnitLabel: string

  setupListeners(bench: Bench) {
    bench.addEventListener('cycle', (event) => {
      const task = event.task
      const result = task.result

      if (!taskResultComplete(result)) return

      const val = this.resultToPrimaryValue(result)
      console.info(`  ✔ Completed: ${task.name} → ${val.toFixed(2)} ${this.primaryUnitLabel}`)
    })
  }

  abstract resultToPrimaryValue(result: TaskResultWithStatistics): number

  abstract print(tasks: Task[], metadataMap: BlendModeMetadataMap): void
}
