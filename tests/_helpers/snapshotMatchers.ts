import { mkdir, readFile, writeFile } from 'fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'path'
import sanitize from 'sanitize-filename'
import { expect } from 'vitest'
import { PixelData } from '../../src'
import { pixelDataToPngBuffer } from './pngBuffer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const testDir = resolve(__dirname, '../')

export async function toMatchPixelDataSnapshot(pixelData: PixelData, snapshotName?: string, message?: string) {
  const buffer = await pixelDataToPngBuffer(pixelData)
  return toMatchPngBufferSnapshot(buffer, snapshotName, message)
}

export async function toMatchPngBufferSnapshot(received: Buffer, snapshotName?: string, message?: string) {
  snapshotName ??= expect.getState().currentTestName + '.png'
  snapshotName = sanitize(snapshotName)
  const fullPath = resolve(testDir, '__snapshots__', snapshotName)
  const isUpdating =
    process.env.VITEST_UPDATE_SNAPSHOTS === 'true' ||
    process.argv.some(a => a === '-u' || a === '--update-snapshots')

  let existing: Buffer | null = null
  if (!isUpdating) {
    existing = await getExisting(fullPath)
  }
  if (!existing) {
    await writeSnapshot(fullPath, received)
    return { pass: true, message: () => `Snapshot written: ${snapshotName}` }
  }
  const suffix = message ? `\n${message}` : ''

  if (received.length !== existing.length) {
    return {
      pass: false,
      message: () =>
        `PNG snapshot file size mismatch: ${snapshotName}\n` +
        `Expected ${existing.length} bytes, got ${received.length} bytes` +
        suffix,
    }
  }

  if (!received.equals(existing)) {
    return {
      pass: false,
      message: () =>
        `PNG snapshot data mismatch: ${snapshotName}\n` +
        `File sizes match (${received.length} bytes) but pixel data differs` +
        suffix,
    }
  }

  return { pass: true, message: () => `PNG snapshot matches: ${snapshotName}` }
}

async function writeSnapshot(fullPath: string, data: Buffer) {
  await mkdir(dirname(fullPath), { recursive: true })
  await writeFile(fullPath, data)
}

async function getExisting(fullPath: string): Promise<Buffer | null> {
  try {
    return await readFile(fullPath)
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw err
  }
}
