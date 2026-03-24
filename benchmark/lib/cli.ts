import cliProgress from 'cli-progress'
import { run, type Type } from 'cmd-ts'
import type { Runner } from 'cmd-ts/dist/cjs/runner'
import { execa, type Options, type ResultPromise } from 'execa'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import p from 'picocolors'
import type { BaseBenchCmdOpts } from '../_types'
import type { BenchmarkRunner } from './BenchmarkRunner'

export const cmdValidateInt: Type<string, number> = {
  async from(value: any) {
    // parseInt takes a string and a radix
    const parsedValue = parseInt(value, 10)
    if (isNaN(parsedValue)) {
      throw new Error(`Not an Integer: '${value}'`)
    }
    return parsedValue
  },
}

export type CmdCall<T extends BaseBenchCmdOpts = BaseBenchCmdOpts> = (opts: Partial<T>) => ResultPromise

export function cmd<T extends BaseBenchCmdOpts>(metaUrl: string, booleanFlags: string[] = []): CmdCall<T> {
  return (opts: Partial<T> = {}) => {
    const {
      subProcess = false,
      ..._opts
    } = opts

    let o: Options
    if (opts.subProcess) {
      o = {
        stderr: 'inherit',
        stdout: 'pipe',
      }
    } else {
      o = {
        stdio: 'inherit',
      }
    }

    return execa('tsx', cmdArgs(metaUrl, _opts, booleanFlags), o)
  }
}

export const cmdArgs = (metaUrl: string, opts: Record<string, any>, booleanFlags: string[] = []) => {
  const file = fileURLToPath(metaUrl)
  const args = toCliArgsStr(opts, booleanFlags)
  return [file, ...args]
}

export const toCliArgsStr = (
  opts: Record<string, any>,
  booleanFlags: string[] = [],
): string[] => {
  const result: string[] = []

  const flags = ['log', ...booleanFlags]

  for (const [key, value] of Object.entries(opts)) {
    if (value === undefined) continue

    if (flags?.includes(key)) {
      if (value) result.push(`--${key}`)
      continue
    }

    result.push(`--${key}`)
    result.push(String(value))
  }

  return result
}

export function errorsToProcessExit<T>(cb: () => T): T {
  try {
    return cb()
  } catch (err: any) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}

export function makeEnumValidator<X extends string | number, T extends readonly X[]>(
  allowedValues: T,
  options?: {
    errorMessage?: (value: string, allowed: readonly X[]) => string;
  },
): Type<string, T[number]> {
  const allowedSet = new Set(allowedValues)

  return {
    async from(input: string): Promise<T[number]> {
      let value: X

      const trimmed = input.trim()
      const num = Number(trimmed)
      if (trimmed === '' || Number.isNaN(num)) {
        value = input as X
      } else {
        value = num as X
      }

      if (!allowedSet.has(value)) {
        const msg =
          options?.errorMessage?.(input, allowedValues) ??
          `Invalid value "${input}". Must be one of: ${allowedValues
            .map((v) => `"${String(v)}"`)
            .join(', ')}`

        throw new Error(msg)
      }
      return value
    },
  }
}

export function runSelf<R extends Runner<any, any>>(metaUrl: string, func: () => R) {
  if (metaUrl === `file://${process.argv[1]}`) {
    run(func(), process.argv.slice(2))
  }
}

export function logProgress(key: string, ...msg: (string | number)[]) {
  console.log(p.cyan(p.bold(key)) + ': ', ...msg.map(m => p.cyanBright(m)))
}

export async function getCmdCall(file: string): Promise<CmdCall> {
  const r = await import(file) as { runner: BenchmarkRunner }

  if (!r?.runner?.cmdCall) {
    console.error(`runner.cmdCall export not found in ${file}`)
    process.exit(1)
  }

  return r.runner.cmdCall
}

export function makeBar() {
  return new cliProgress.SingleBar({
    format: ` {bar} {percentage}% | {value}/{total} | ${p.cyan(`{message}`)}`,
    formatBar: (progress, options) => {

      const completeSize = Math.round(progress * options.barsize!)
      const incompleteSize = options.barsize! - completeSize

      const result = options.barCompleteString!.substring(0, completeSize) +
        options.barGlue +
        options.barIncompleteString!.substring(0, incompleteSize)

      if (progress < 0.33) {
        return p.red(result)
      }
      if (progress < 0.5) {
        return p.yellow(result)
      }
      return p.green(result)
    },
  }, cliProgress.Presets.shades_grey)
}
