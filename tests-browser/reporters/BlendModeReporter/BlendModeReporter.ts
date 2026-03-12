import type { TaskResultWithStatistics } from 'tinybench'
import { BenchReporter } from '../BenchReporter'

export abstract class BlendModeReporter extends BenchReporter {
  primaryUnitLabel = 'ops/s'

  resultToPrimaryValue(result: TaskResultWithStatistics): number {
    return result.throughput.mean
  }
}
