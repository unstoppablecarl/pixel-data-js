import { normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import path from 'path'

export const normalizePath = (file: string) => normalize(file).replace(/\\/g, '/')

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export const ROOT_DIR = path.resolve(__dirname, '../src')

export function sortWithUnderscoreFirst(a: string, b: string): number {
  const baseName = (s: string) => s.trimStart().split('/').pop() ?? s
  const aBase = baseName(a)
  const bBase = baseName(b)
  const aUnder = aBase.startsWith('_')
  const bUnder = bBase.startsWith('_')
  if (aUnder && !bUnder) return -1
  if (!aUnder && bUnder) return 1
  return a.localeCompare(b)
}

export function standardSort(a: string, b: string): number {
  const al = a.toLowerCase()
  const bl = b.toLowerCase()

  // natural sort: compare numeric runs as integers
  const re = /(\d+)|(\D+)/g
  const aParts = al.match(re) ?? []
  const bParts = bl.match(re) ?? []
  const len = Math.max(aParts.length, bParts.length)

  for (let i = 0; i < len; i++) {
    const ap = aParts[i] ?? ''
    const bp = bParts[i] ?? ''
    const an = parseInt(ap, 10)
    const bn = parseInt(bp, 10)
    if (!isNaN(an) && !isNaN(bn) && an !== bn) return an - bn
    if (ap < bp) return -1
    if (ap > bp) return 1
  }

  // uppercase before lowercase tiebreak
  return a < b ? -1 : a > b ? 1 : 0
}
