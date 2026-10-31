import { loadImage } from 'canvas'
import { app } from 'electron'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'
import { getColorsFromImage, normalizeColors } from '../graphics'

export const albumArtColors: Float32Array[] = []
export const albumArtTitles: string[] = []
export const albumArtSongIds: number[] = [] // 곡 DB의 title(번호). 자켓 번호와 같다

const JACKET_URL = 'https://v-archive.net/s3/images/jackets'
const META_FILE = 'jacket-meta.json'
const LEGACY_FILE = 'jacket-data.json' // 40x40 원본 색을 담던 이전 캐시
const DOWNLOAD_CONCURRENCY = 6

export type ProgressCallback = (done: number, total: number) => void

interface JacketMeta {
  version: number
  titleList: string[]
}

export const jacketDir = (): string => join(app.getPath('userData'), 'jackets')
const metaPath = (): string => join(app.getPath('userData'), META_FILE)

// 곡 번호 -> 120x120 JPEG 경로. 받지 못한 자켓은 파일이 없다
export const getJacketPath = (id: number): string => join(jacketDir(), `${id}.jpg`)

// 자켓 이미지는 곡마다 바뀌지 않으므로, 없는 것만 받는다
async function downloadMissing(count: number, onProgress?: ProgressCallback): Promise<void> {
  mkdirSync(jacketDir(), { recursive: true })
  const queue: number[] = []
  for (let id = 0; id < count; id++) if (!existsSync(getJacketPath(id))) queue.push(id)
  if (queue.length === 0) return

  console.log(`Cache: downloading ${queue.length} jackets`)
  const total = queue.length
  let done = 0
  let failed = 0
  onProgress?.(0, total)
  const worker = async (): Promise<void> => {
    for (let id = queue.pop(); id !== undefined; id = queue.pop()) {
      try {
        const resp = await fetch(`${JACKET_URL}/${id}.jpg`)
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
        const file = getJacketPath(id)
        writeFileSync(`${file}.tmp`, Buffer.from(await resp.arrayBuffer()))
        renameSync(`${file}.tmp`, file)
      } catch {
        failed++ // 다음 실행 때 다시 시도한다
      }
      onProgress?.(++done, total)
    }
  }
  await Promise.all(Array.from({ length: DOWNLOAD_CONCURRENCY }, worker))
  if (failed > 0) console.warn(`Cache: failed to download ${failed} jackets`)
}

async function computeAlbumArt(titleList: string[]): Promise<void> {
  const colors: Float32Array[] = []
  const titles: string[] = []
  const ids: number[] = []

  for (let id = 0; id < titleList.length; id++) {
    if (!existsSync(getJacketPath(id))) continue
    try {
      const img = await loadImage(await readFile(getJacketPath(id)))
      colors.push(normalizeColors(getColorsFromImage(img)))
      titles.push(titleList[id])
      ids.push(id)
    } catch {
      console.warn('Cache: broken jacket file:', id)
    }
  }

  albumArtColors.length = 0
  albumArtTitles.length = 0
  albumArtSongIds.length = 0
  albumArtColors.push(...colors)
  albumArtTitles.push(...titles)
  albumArtSongIds.push(...ids)
  console.log('Colors length: ', albumArtColors.length)
}

function readMeta(): JacketMeta | undefined {
  try {
    const meta = JSON.parse(readFileSync(metaPath(), 'utf-8')) as JacketMeta
    return Array.isArray(meta.titleList) ? meta : undefined
  } catch {
    return undefined
  }
}

export function readJacketDataVersion(): number {
  const meta = readMeta()
  console.log(meta ? `Cache: cached version: ${meta.version}` : 'Cache: no cache file found')
  return meta?.version ?? 0
}

async function load(titleList: string[], onProgress?: ProgressCallback): Promise<void> {
  await downloadMissing(titleList.length, onProgress)
  await computeAlbumArt(titleList)
  rmSync(join(app.getPath('userData'), LEGACY_FILE), { force: true })
}

// 자켓 이미지를 모두 지우고 다시 받는다. 앱을 다시 시작할 필요가 없다
// 받는 동안에는 이전 인식 데이터를 그대로 쓰고, 끝나면 새로 바꾼다
export async function reloadJackets(onProgress?: ProgressCallback): Promise<boolean> {
  const meta = readMeta()
  if (!meta) return false

  rmSync(jacketDir(), { recursive: true, force: true })
  await load(meta.titleList, onProgress)
  console.log(`Cache: reloaded ${albumArtColors.length} jackets`)
  return albumArtColors.length > 0
}

export async function loadAlbumArtData(
  titleList: string[],
  version: number,
  onProgress?: ProgressCallback
): Promise<void> {
  if (albumArtColors.length > 0) return

  const meta: JacketMeta = { version, titleList }
  writeFileSync(metaPath(), JSON.stringify(meta))
  await load(titleList, onProgress)
  console.log(`Cache: saved ${titleList.length} jackets (version: ${version})`)
}

export async function loadAlbumArtDataFromFile(
  version: number,
  onProgress?: ProgressCallback
): Promise<boolean> {
  if (albumArtColors.length > 0) return true

  const meta = readMeta()
  if (!meta || meta.version !== version) {
    console.warn(`Cache: cache version (${meta?.version}) need to update, target: (${version})`)
    return false
  }

  await load(meta.titleList, onProgress)
  console.log(`Cache: loaded ${albumArtColors.length} jackets. (${meta.version})`)
  return true
}
