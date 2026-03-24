import glob from 'fast-glob'
import { mkdirSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'path'
import sanitize from 'sanitize-filename'
import { BENCH_RESULTS_DIR } from '../bench.config'
import { gitCurrentBranch } from './gitHelpers'
import { type ParsedMitataResult, parseMitataResultJson } from './mitata'

export async function runnerResultFilePath(
  callerUrl: string,
  group?: string,
  prefix?: string,
) {
  group = await prepareGroup(group)

  const name = path.basename(fileURLToPath(callerUrl))
    .replace(/\.bench.ts$/, '')
    .replace(/\.ts$/, '')

  return formatResultFilePath(group, name, prefix)
}

export function formatResultFilePath(
  group: string,
  name: string,
  prefix?: string,
) {
  name = sanitize(name)
  const safeGroup = sanitize(group)
  if (prefix) {
    name += '-' + sanitize(prefix)
  }
  return path.join(BENCH_RESULTS_DIR, safeGroup, `${name}.json`)
}

type JsonResultPath = {
  metaUrl: string,
  prefix?: string,
  group?: string,
}

export async function prepareGroup(group: string | null | undefined): Promise<string> {
  if (group === undefined || group === null || group === '') {
    return await gitCurrentBranch() ?? 'unknown'
  }
  return group
}

export async function writeBenchResultsJson({ metaUrl, jsonStr, prefix, group }: JsonResultPath & {
  jsonStr: string,
}) {
  const outputFile = await runnerResultFilePath(metaUrl, group, prefix)

  mkdirSync(dirname(outputFile), { recursive: true })
  writeFileSync(outputFile, jsonStr, { encoding: 'utf8' })
  return outputFile
}

export async function loadBenchResultsJson(
  basePath: string,
  targetPath: string,
): Promise<{
  name: string,
  baseFile: string | null,
  baseData: ParsedMitataResult | null,
  targetFile: string | null,
  targetData: ParsedMitataResult | null
}[]> {
  const [
    baseResults,
    targetResults,
  ] = await Promise.all([
    glob(basePath + '/*.json'),
    glob(targetPath + '/*.json'),
  ])

  const baseMap = new Map(baseResults.map(p => [
    path.basename(p),
    p,
  ]))

  const targetMap = new Map(targetResults.map(p => [
    path.basename(p),
    p,
  ]))

  const allNames = [
    ...new Set([
      ...baseMap.keys(),
      ...targetMap.keys(),
    ]),
  ]

  const loadData = async (filePath: string | null) => {
    if (!filePath) {
      return null
    }

    const content = await readFile(
      filePath,
      'utf8',
    )

    return parseMitataResultJson(JSON.parse(content))
  }

  return Promise.all(allNames.map(async name => {
    const baseFile = baseMap.get(name) || null
    const targetFile = targetMap.get(name) || null

    const [
      baseData,
      targetData,
    ] = await Promise.all([
      loadData(baseFile),
      loadData(targetFile),
    ])

    return {
      name,
      baseFile,
      baseData,
      targetFile,
      targetData,
    }
  }))
}
