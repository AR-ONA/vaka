import { ipcMain } from 'electron'
import { SongDetail, SongDetailResult } from '../../types/api'

// 패턴 태그(드르륵, 폭타 등)를 모아 두는 커뮤니티 서비스
const BASE_URL = 'https://djmax-bf8a54aa6ab0.herokuapp.com'
const REQUEST_TIMEOUT = 10_000
const CACHE_TTL = 60 * 60 * 1000

const cache = new Map<string, { fetchedAt: number; detail: SongDetail }>()

async function loadSongDetail(
  button: number,
  songId: number,
  pattern: string
): Promise<SongDetailResult> {
  const key = `${button}/${songId}/${pattern}`
  const cached = cache.get(key)
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
    return { success: true, detail: cached.detail }
  }

  try {
    const url = `${BASE_URL}/songs/${button}/${songId}/${encodeURIComponent(pattern)}`
    const resp = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT) })
    if (resp.status === 404) {
      return { success: false, status: 404, message: '이 패턴의 상세 정보가 아직 없습니다' }
    }
    if (!resp.ok) {
      console.error('Song detail rejected:', resp.status)
      return { success: false, status: resp.status, message: '상세 정보를 불러오지 못했습니다' }
    }
    const detail = (await resp.json()) as SongDetail
    cache.set(key, { fetchedAt: Date.now(), detail })
    return { success: true, detail }
  } catch (error) {
    console.error('Failed to load song detail:', error)
    const reason = error instanceof Error ? error.message : String(error)
    return { success: false, message: `상세 정보를 불러오지 못했습니다 (${reason})` }
  }
}

export function registerSongDetailIPC(): void {
  ipcMain.handle('load-song-detail', (_, button: number, songId: number, pattern: string) =>
    loadSongDetail(button, songId, pattern)
  )
}
