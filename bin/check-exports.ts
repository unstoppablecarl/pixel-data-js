import fs from 'fs'
import path from 'path'

/**
 * CLI script to verify that all source files are exported in the main index.
 */
async function checkExports(
  exclude: string[] = [],
): Promise<void> {
  const srcDir = path.join(process.cwd(), 'src')

  const indexPath = path.join(srcDir, 'index.ts')

  if (!fs.existsSync(indexPath)) {
    console.error('index.ts not found in src directory')

    process.exit(1)
  }

  const indexContent = fs.readFileSync(indexPath, 'utf-8')

  const files = fs.readdirSync(srcDir, {
    recursive: true
  }) as string[]

  const missing: string[] = []

  for (const file of files) {
    const fullPath = path.join(srcDir, file)

    const isFile = fs.statSync(fullPath).isFile()

    const isTs = file.endsWith('.ts') || file.endsWith('.tsx')

    const isIndex = file === 'index.ts'

    const isExcluded = exclude.some((pattern) => {
      return file.includes(pattern)
    })

    if (!isFile || !isTs || isIndex || isExcluded) {
      continue
    }

    // Generate the expected export path (e.g., ./utils/fileUtils)
    const relativePath = file.replace(/\.tsx?$/, '')

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

  console.log('All relevant files are exported!')
}

// Simple CLI argument handling
const args = process.argv.slice(2)

const excludeList = args.filter((arg) => {
  return !arg.startsWith('--')
})

checkExports(excludeList)
