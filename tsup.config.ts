import glob from 'fast-glob'
import fs from 'fs/promises'
import path from 'path'
import { SourceMapConsumer } from 'source-map'
import { defineConfig } from 'tsup'
import { esbuildPlugin } from 'unplugin-inline'

const macroFunctionPrefixes = ['_macro_', '_inline_']

const defaultConfig = {
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
  async onSuccess() {
    const distPath = path.resolve('dist')

    const globOptions = {
      cwd: distPath,
      absolute: true,
    }

    const files = await glob(['**/*.js', '**/*.mjs', '**/*.cjs'], globOptions)

    for (const file of files) {
      const content = await fs.readFile(file, 'utf-8')
      const lines = content.split('\n')

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        for (let j = 0; j < macroFunctionPrefixes.length; j++) {
          const prefix = macroFunctionPrefixes[j]
          if (line.includes(prefix)) {
            const lineNumber = i + 1
            const columnNumber = line.indexOf(prefix)
            const mapPath = `${file}.map`

            let sourceMsg = `📍 Location: ${file}:${lineNumber}`

            try {
              const mapContent = await fs.readFile(mapPath, 'utf-8')
              const rawSourceMap = JSON.parse(mapContent)
              const consumer = await new SourceMapConsumer(rawSourceMap)

              const pos = consumer.originalPositionFor({
                line: lineNumber,
                column: columnNumber,
              })

              if (pos.source && pos.line) {
                const dir = path.dirname(file)
                const originalPath = path.resolve(dir, pos.source)

                sourceMsg = `📍 Source Location: ${originalPath}:${pos.line}`
              }

              consumer.destroy()
            } catch (err) {
              console.log(`⚠️ Warning: Could not parse sourcemap for ${file}`)
            }

            console.error(`\n❌ Build Error: function not inlined:  (macroFunctionPrefix: "${prefix}") found!`)
            console.error(sourceMsg)
            process.exit(1)
          }
        }
      }
    }

    console.log('\n✅ Build check passed: No macro functions found.')
  },
}

// const DEV = {
//   ...defaultConfig,
//   entry: {
//     'index.dev': 'src/index.ts',
//   },
//   define: {
//     __DEV__: 'true',
//   },
// }
/**
 * to implement dev env update package.json exports to look like this
 * "exports": {
 *     ".": {
 *       "types": "./dist/index.prod.d.ts",
 *       "source": "./src/index.ts",
 *       "development": {
 *         "require": "./dist/index.dev.cjs",
 *         "import": "./dist/index.dev.js"
 *       },
 */

const PROD = {
  ...defaultConfig,
  entry: {
    'index.prod': 'src/index.ts',
  },
  define: {
    __DEV__: 'false',
  },
}

export default defineConfig([
  // {
  //   ...DEV,
  //   format: 'esm',
  //   esbuildPlugins: [
  //     esbuildPlugin(),
  //   ],
  // },
  // {
  //   ...DEV,
  //   format: 'cjs',
  //   esbuildPlugins: [
  //     esbuildPlugin(),
  //   ],
  // },
  {
    ...PROD,
    format: 'esm',
    dts: true,
    esbuildPlugins: [
      esbuildPlugin(),
    ],
  },
  {
    ...PROD,
    format: 'cjs',
    esbuildPlugins: [
      esbuildPlugin(),
    ],
  },
])
