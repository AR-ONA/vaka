import { app, ipcMain } from 'electron'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { parse } from 'csv-parse/sync'
import { ConstantEntry, ConstantGroup, ConstantResult } from '../../types/api'

// 디제이맥스 리스펙트 V 난이도표 (공개 Google 시트). 탭(gid)마다 버튼별 상수표가 있다
const SHEET_ID = '1ks1dwJyNjkAXYtQ_6UZIeNOCGOmhf2jMbakpTcJm9rw'
const SHEET_GIDS: Record<number, number> = {
  4: 979055934,
  5: 112529029,
  6: 2010625608,
  8: 1833696991
}
const REQUEST_TIMEOUT = 15_000

// 내려받은 상수표는 디스크에 저장해 두고, 이 시간 안에는 다시 받지 않는다
const CACHE_FILE = 'constants-cache.json'
const CACHE_VERSION = 1 // 저장 형식이 바뀌면 올린다
const CACHE_TTL = 24 * 60 * 60 * 1000

interface CacheEntry {
  fetchedAt: number
  groups: ConstantGroup[]
}

interface CacheFile {
  version: number
  entries: Record<number, CacheEntry>
}

let cache: CacheFile | null = null

function getCache(): CacheFile {
  if (cache) return cache
  try {
    const data = JSON.parse(readFileSync(join(app.getPath('userData'), CACHE_FILE), 'utf-8'))
    cache = data.version === CACHE_VERSION ? data : { version: CACHE_VERSION, entries: {} }
  } catch {
    cache = { version: CACHE_VERSION, entries: {} }
  }
  return cache!
}

export function clearConstantsCache(): void {
  cache = { version: CACHE_VERSION, entries: {} }
  rmSync(join(app.getPath('userData'), CACHE_FILE), { force: true })
}

function saveCache(): void {
  try {
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(join(app.getPath('userData'), CACHE_FILE), JSON.stringify(getCache()))
  } catch (error) {
    console.error('Failed to save constants cache:', error)
  }
}

const PATTERNS: Record<string, ConstantEntry['pattern']> = {
  NORMAL: 'NM',
  HARD: 'HD',
  MAXIMUM: 'MX',
  SC: 'SC'
}

export function parseCsv(text: string): string[][] {
  return parse(text, { bom: true, relax_column_count: true, skip_empty_lines: true })
}

// 탭마다 열 구성이 달라서(예: 5B의 보조 키 여부, 8B의 키파트 위주) 머리글 이름으로 찾는다
export function toGroups(rows: string[][]): ConstantGroup[] {
  const header = rows[0] ?? []
  const col = (name: string): number => header.findIndex((h) => h.trim() === name)
  const [cConst, cName, cPattern, cLevel, cCategory, cRandom, cNote] = [
    '상수',
    '곡명',
    '난이도',
    '레벨',
    '카테고리',
    '황배 여부',
    '비고'
  ].map(col)
  const extraCols = ['보조 키 여부', '키파트 위주'].map(col).filter((c) => c >= 0)
  if ([cConst, cName, cPattern, cLevel].includes(-1)) throw new Error('시트 형식이 바뀌었습니다')

  const groups: ConstantGroup[] = []
  for (const row of rows.slice(1)) {
    const constant = row[cConst]?.trim()
    const name = row[cName]?.trim()
    const pattern = PATTERNS[row[cPattern]?.trim()]
    if (!constant || !name || !pattern) continue // 상수 구분 줄, 빈 줄, 알 수 없는 패턴

    if (groups[groups.length - 1]?.constant !== constant) groups.push({ constant, entries: [] })
    groups[groups.length - 1].entries.push({
      name,
      pattern,
      level: Number(row[cLevel]) || 0,
      category: row[cCategory]?.trim() ?? '',
      marks: [...extraCols, cRandom]
        .map((c) => row[c]?.trim())
        .filter(Boolean)
        .join(' '),
      note: row[cNote]?.trim() ?? ''
    })
  }
  return groups
}

async function fetchConstants(button: number): Promise<ConstantGroup[]> {
  const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GIDS[button]}`
  const resp = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  return toGroups(parseCsv(await resp.text()))
}

// force가 아니면 유효한 캐시를 그대로 쓰고, 받기에 실패하면 오래된 캐시라도 보여 준다
async function loadConstants(button: number, force = false): Promise<ConstantResult> {
  if (SHEET_GIDS[button] === undefined)
    return { success: false, message: '지원하지 않는 버튼입니다' }

  const entry = getCache().entries[button]
  if (!force && entry && Date.now() - entry.fetchedAt < CACHE_TTL) {
    return { success: true, groups: entry.groups, fetchedAt: entry.fetchedAt }
  }

  try {
    const groups = await fetchConstants(button)
    const fetchedAt = Date.now()
    getCache().entries[button] = { fetchedAt, groups }
    saveCache()
    return { success: true, groups, fetchedAt }
  } catch (error) {
    console.error('Failed to load constants:', error)
    if (entry) {
      return { success: true, groups: entry.groups, fetchedAt: entry.fetchedAt, stale: true }
    }
    const reason = error instanceof Error ? error.message : String(error)
    return { success: false, message: `상수표를 불러오지 못했습니다 (${reason})` }
  }
}

export function registerConstantsIPC(): void {
  ipcMain.handle('load-constants', (_, button: number, force?: boolean) =>
    loadConstants(button, force)
  )
}
