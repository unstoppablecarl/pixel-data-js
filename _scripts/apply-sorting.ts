import glob from 'fast-glob'
import { readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'path'

applySortBlocksToFiles([
  // 'src/index.ts',
  'src/**/*.ts',
  'tests/**/*.ts'
])

async function applySortBlocksToFiles(pattern: string | string[]): Promise<void> {
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const rootDir = path.resolve(__dirname, '..')
  const files = await glob(pattern, { cwd: rootDir, absolute: true })

  if (files.length === 0) {
    console.log('No files matched:', pattern)
    return
  }

  const results = (await Promise.all(
    files.map(async (file): Promise<FileResult> => {
      const original = await readFile(file, 'utf-8')

      if (!original.includes('// @sort')) {
        return { file, status: 'skipped' }
      }

      const sorted = applySortBlocks(original)

      if (sorted === original) {
        return { file, status: 'unchanged' }
      }

      await writeFile(file, sorted, 'utf-8')
      return { file, status: 'updated' }
    }),
  )).filter(f => f.status !== 'skipped')


  const icons: Record<Status, string> = { updated: '✓', unchanged: '–', skipped: '·' }

  for (const { file, status } of results) {
    console.log(`${icons[status]} ${file} (${status})`)
  }

  const counts = results.reduce<Record<Status, number>>(
    (acc, { status }) => {
      acc[status]++
      return acc
    },
    { updated: 0, unchanged: 0, skipped: 0 },
  )

  const updated = results.filter(r => r.status === 'updated')

  if (updated.length === 0) {
    console.log('Nothing to sort.')
    return
  }

  for (const { file } of updated) {
    console.log(`✓ ${file}`)
  }

  console.log(`\nSorted ${updated.length} file${updated.length === 1 ? '' : 's'}`)
}

function applySortBlocks(code: string): string {
  const lines = code.split('\n')
  const result: string[] = []
  let i = 0
  let sortAll = false

  while (i < lines.length) {
    const line = lines[i]

    if (line.trimEnd().endsWith('// @sort-all')) {
      sortAll = true
      result.push(line)
      i++
    } else if (line.trimEnd().endsWith('// @sort')) {
      result.push(line)
      i++

      const block: string[] = []
      while (i < lines.length && lines[i].trim() !== '') {
        block.push(lines[i])
        i++
      }

      block.sort((a, b) => a.localeCompare(b))
      result.push(...block)
    } else if (sortAll) {
      if (line.trim() !== '') {
        const block: string[] = []
        while (i < lines.length && lines[i].trim() !== '') {
          block.push(lines[i])
          i++
        }
        block.sort((a, b) => a.localeCompare(b))
        result.push(...block)
      } else {
        result.push(line)
        i++
      }
    } else {
      result.push(line)
      i++
    }
  }

  return result.join('\n')
}

type Status = 'updated' | 'unchanged' | 'skipped'

interface FileResult {
  file: string
  status: Status
}
