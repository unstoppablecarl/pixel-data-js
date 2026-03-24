import type { BaseBenchCmdOpts } from '../_types'
import { runnerResultFilePath } from './benchmark-results'
import { cmd, type CmdCall } from './cli'

export type BenchmarkFileWriter<FileOpts extends {} = {}> = {
  outputFilePath: (opts: FileOpts & { group?: string }) => Promise<string>
}

export type BenchmarkRunner<T extends BaseBenchCmdOpts = BaseBenchCmdOpts> = {
  cmdCall: CmdCall<T>,
}

export function makeRunner<T extends BaseBenchCmdOpts = BaseBenchCmdOpts>(metaUrl: string): BenchmarkRunner<T> & BenchmarkFileWriter {
  return {
    cmdCall: cmd<T>(metaUrl),
    outputFilePath: ({ group }) => runnerResultFilePath(metaUrl, group),
  }
}
