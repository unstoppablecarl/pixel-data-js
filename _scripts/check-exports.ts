#!/usr/bin/env tsx

import fs from 'fs'
import { fileURLToPath } from 'node:url'
import path from 'path'

/**
 * CLI script to verify that all source files are exported in the main index.
 */

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const srcDir = path.resolve(__dirname, '../src')

async function checkExports(
  filter: (file: string) => boolean,
): Promise<void> {
  const indexPath = path.join(srcDir, 'index.ts')

  if (!fs.existsSync(indexPath)) {
    console.error('index.ts not found in src directory')

    process.exit(1)
  }

  const indexContent = fs.readFileSync(indexPath, 'utf-8')

  const files = fs.readdirSync(srcDir, {
    recursive: true,
  }) as string[]

  const missing: string[] = []

  for (const file of files) {
    const fullPath = path.join(srcDir, file)
    const isFile = fs.statSync(fullPath).isFile()
    const isTs = file.endsWith('.ts')
    // const isIndex = file === 'index.ts'

    const relativePath1 = path.relative(srcDir, fullPath)
    const isValid = filter(relativePath1)

    if (!isFile || !isTs || !isValid) {
      continue
    }

    // Generate the expected export path (e.g., ./utils/fileUtils)
    const relativePath = file.replace(/\.ts$/, '')
    const exportPattern = new RegExp(`export .* from ['"]\\.\\/${relativePath}['"]`)

    if (!exportPattern.test(indexContent)) {
      missing.push(file)
    }
  }

  if (missing.length > 0) {
    console.error('The following files are not exported in src/index.ts:')

    missing.forEach((file) => {
      console.log(`- ${file}`)
    })

    process.exit(1)
  }

  console.log('All relevant files are exported! 🎉')
}

checkExports((file) => {

  // console.log(file)
  if (file.startsWith('Internal/')) return false

  return ![
    'index.ts',
    'globals.d.ts',
    'Canvas/_constants.ts',
  ].includes(file)
})
