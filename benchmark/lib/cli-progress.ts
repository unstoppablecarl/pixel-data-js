import cliProgress from 'cli-progress'
import { type ResultPromise } from 'execa'

export interface ProgressMessage {
  type: 'progress'
  step?: number,
  total?: number,
  message?: string
}

export function reportProgress(
  {
    step = undefined,
    total = undefined,
    message = undefined,
  }: {
    step?: number,
    total?: number,
    message?: string
  },
) {
  const msg: ProgressMessage = { type: 'progress', step, total, message }
  console.log(JSON.stringify(msg))
}

export function makeBarProgressUpdater(bar: cliProgress.SingleBar, prefix: string = '') {
  return ({ message, step, total }: ProgressMessage) => {
    if (prefix && prefix !== '') {
      message = prefix + ': ' + message
    }
    if (total !== undefined && total !== bar.getTotal()) {
      bar.setTotal(total)
    }
    if (step !== undefined) {
      bar.update(step, {
        message,
      })
    } else {
      bar.update({ message })
    }
  }
}

export async function runWithProgress(subprocess: ResultPromise, onProgress: (msg: ProgressMessage) => void) {
  subprocess.stdout?.on('data', (chunk: Buffer) => {
    const lines = chunk.toString().split('\n')
    for (const line of lines) {
      if (!line.trim()) continue

      try {
        const data = JSON.parse(line)
        if (data.type === 'progress') {
          onProgress(data as ProgressMessage)
        } else {
          // Normal log output → still show it
          process.stdout.write(line + '\n')
        }
      } catch {
        // Not JSON → regular console output
        process.stdout.write(line + '\n')
      }
    }
  })

  await subprocess
}
