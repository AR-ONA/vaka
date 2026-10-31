import { app, ipcMain } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { BestResult } from '../../types/api'

const PROFILE_FILE = 'profile.json'
const REQUEST_TIMEOUT = 10_000
const BEST_LIMIT = 50

function getProfilePath(): string {
  return join(app.getPath('userData'), PROFILE_FILE)
}

function readNickname(): string {
  try {
    return JSON.parse(readFileSync(getProfilePath(), 'utf-8')).nickname ?? ''
  } catch {
    return ''
  }
}

function writeNickname(nickname: string): void {
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(getProfilePath(), JSON.stringify({ nickname: nickname.trim() }))
}

// limit이 있으면 DJ POWER가 높은 순으로 상위 기록만, 없으면 기록 전체를 조회한다
async function loadRecords(button: number, limit?: number): Promise<BestResult> {
  const nickname = readNickname()
  if (!nickname) return { success: false, message: '닉네임이 설정되지 않았습니다' }

  const query = new URLSearchParams(
    limit === undefined ? {} : { sort: 'djpower', order: 'desc', limit: String(limit) }
  )
  const url = `https://v-archive.net/api/v2/archive/${encodeURIComponent(nickname)}/button/${button}?${query}`

  try {
    const resp = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
    const body = await resp.json().catch(() => null)
    if (!resp.ok || !body?.success) {
      console.error('Best rejected:', resp.status, body)
      return { ...body, success: false, status: resp.status }
    }
    return body
  } catch (error) {
    console.error('Failed to load best:', error)
    const reason = error instanceof Error ? error.message : String(error)
    return { success: false, message: `기록을 불러오지 못했습니다 (${reason})` }
  }
}

export function registerRecordsIPC(): void {
  ipcMain.handle('get-nickname', (): string => readNickname())
  ipcMain.handle('set-nickname', (_, nickname: string): void => writeNickname(nickname))
  ipcMain.handle('load-best', (_, button: number) => loadRecords(button, BEST_LIMIT))
  ipcMain.handle('load-records', (_, button: number) => loadRecords(button))
}
