import glob from 'fast-glob'
import fs from 'fs/promises'
import { BENCH_RUNNERS_DIR } from '../bench.config'

export async function dirExists(dirPath: string) {
  try {
    await fs.access(dirPath)
    return true
  } catch (error) {
    if ((error as any).code === 'ENOENT') {
      return false
    }
    throw error
  }
}

export const fileExists = dirExists

export async function findBenchmarkFiles(
  contains: string,
  {
    single = true,
    multi = true,
  }: {
    single?: boolean,
    multi?: boolean
  } = {},
): Promise<string[]> {

  const parts = [
    single && 'bench',
    multi && 'multi.bench',
  ].filter(Boolean)
  const segment = parts.length > 1
    ? `{${parts.join(',')}}`
    : parts[0] || 'bench'

  const pattern = `${BENCH_RUNNERS_DIR}/**/*.${segment}.ts`

  const files = await glob(pattern, { absolute: true })
  // Case-sensitive first (default behavior)
  const sensitiveMatches = files.filter((file) => {
    const filename = file.split(/[\\/]/).pop() || ''
    return filename.includes(contains)
  })

  if (sensitiveMatches.length > 0) {
    return sensitiveMatches
  }

  // Fallback to case-insensitive
  const lowerContains = contains.toLowerCase()
  return files.filter((file) => {
    const filename = file.split(/[\\/]/).pop() || ''
    return filename.toLowerCase().includes(lowerContains)
  })
}

export type RunnerPair = {
  single: string
  multi: null
} | {
  single: string
  multi: string
}

export async function findBenchmarkPairedFiles(filterStr?: string): Promise<RunnerPair[]> {
  const source = `${BENCH_RUNNERS_DIR}/**/*.bench.ts`
  const files = await glob(source)
  const map = new Map<string, RunnerPair>()
  for (const file of files) {

    if (filterStr && filterStr !== '' && !file.includes(filterStr)) continue
    // Extract basename: foo.bench.ts or foo.multi.bench.ts
    const basename = file.split(/[\\/]/).pop()! // safe because glob returns strings

    // Remove .bench.ts suffix to get the "name"
    const name = basename.replace(/\.bench\.ts$/, '')

    // Determine if it's the multi variant
    const isMulti = name.endsWith('.multi')

    const cleanName = isMulti ? name.replace(/\.multi$/, '') : name

    if (!map.has(cleanName)) {
      map.set(cleanName, { single: '', multi: null })
    }

    const entry = map.get(cleanName)!

    if (isMulti) {
      entry.multi = file
    } else {
      entry.single = file
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const nameA = (a.single || a.multi || '').replace(/\.multi\.bench\.ts$/, '').replace(/\.bench\.ts$/, '')
    const nameB = (b.single || b.multi || '').replace(/\.multi\.bench\.ts$/, '').replace(/\.bench\.ts$/, '')
    return nameA.localeCompare(nameB)
  })
}

