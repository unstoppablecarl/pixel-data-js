import type { TaskResultWithStatistics } from 'tinybench'
import { BenchReporter } from '../BenchReporter'

export abstract class BlendPixelDataReporter extends BenchReporter {
  primaryUnitLabel = 'MP/s'
  protected megapixels: number

  constructor(width: number, height: number) {
    super()
    this.megapixels = (width * height) / 1_000_000
  }

  resultToPrimaryValue(result: TaskResultWithStatistics): number {
    return result.throughput.mean * this.megapixels
  }
}
