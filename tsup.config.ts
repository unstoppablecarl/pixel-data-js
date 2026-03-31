import { defineConfig } from 'tsup'
import { esbuildPlugin } from 'unplugin-inline'

const defaultConfig = {
  sourcemap: true,
  clean: true,
  format: ['cjs', 'esm'],
}

const DEV = {
  ...defaultConfig,
  entry: {
    'index.dev': 'src/index.ts',
  },
  define: {
    __DEV__: 'true',
  },
}

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
  {
    ...DEV,
    format: 'esm',
    esbuildPlugins: [
      esbuildPlugin(),
    ],
  },
  {
    ...DEV,
    format: 'cjs',
    esbuildPlugins: [
      esbuildPlugin(),
    ],
  },
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
