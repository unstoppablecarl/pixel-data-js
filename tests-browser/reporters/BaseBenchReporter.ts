export type MetadataMap = Map<string, { type: string, name: string, testCase: string }>

export abstract class BaseBenchReporter {
  protected megapixels: number

  constructor(width: number, height: number) {
    this.megapixels = (width * height) / 1_000_000
  }

  setupListeners(bench: any) {
    bench.addEventListener('cycle', (event: any) => {
      const task = event.task
      const result = task.result
      if (!result) return

      const mpps = result.throughput.mean * this.megapixels
      console.info(`  ✔ Completed: ${task.name} → ${mpps.toFixed(2)} MP/s`)
    })
  }

  abstract print(tasks: any[], metadataMap: MetadataMap): void
}
