import { Table } from 'console-table-printer'

export class BenchReporter {
  private megapixels: number

  constructor(width: number, height: number) {
    this.megapixels = (width * height) / 1_000_000
  }

  setupListeners(bench: any) {
    bench.addEventListener('cycle', (event: any) => {
      const task = event.task;
      const result = task.result;

      if (!result) {
        return;
      }

      const hz = result.throughput.mean;
      const mpps = (hz * this.megapixels).toFixed(2);

      console.info(`  ✔ Completed: ${task.name} → ${mpps} MP/s`);
    });
  }

  printFinal(tasks: any[]) {
    const p = new Table({
      title: '📊 Blending Performance Summary Mega Pixels / Second',
      columns: [
        { name: 'name', title: 'Blend Mode', alignment: 'left' },
        { name: 'mpps', title: 'MP/s', alignment: 'right' },
        { name: 'ms', title: 'Avg Latency', alignment: 'right' },
      ],
    });

    for (const task of tasks) {
      const result = task.result;

      if (!result) {
        continue;
      }

      const hz = result.throughput.mean;
      const mpps = hz * this.megapixels;
      const ms = result.latency.mean;

      p.addRow({
        name: task.name,
        mpps: `${mpps.toFixed(2)} MP/s`,
        ms: `${ms.toFixed(2)} ms`,
      }, {
        color: mpps > 200 ? 'green' : 'yellow',
      });
    }
    p.printTable();
  }
}
