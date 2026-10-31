import { Song } from './song'

export interface Account {
  userNo: number
  token: string
}

export interface UploadScoreRequest {
  name: string
  button: 4 | 5 | 6 | 8
  pattern: 'NM' | 'HD' | 'MX' | 'SC'
  score: number
  maxCombo: boolean
  dlc?: string
  composer?: string
}

export interface UploadScoreResult {
  success: boolean
  status?: number
  message?: string
  [key: string]: unknown
}

// 유저 기록 조회 API V2의 record
export interface BestRecord {
  title: number
  name: string
  dlcCode: string
  pattern: 'NM' | 'HD' | 'MX' | 'SC'
  level: number
  floor: number | null // 정렬용 층 (133 = 13.3)
  floorName: string | null
  score: number
  maxCombo: boolean
  rating: number | null
  djpower: number
  maxDjpower: number | null
}

export interface BestResult {
  success: boolean
  status?: number
  errorCode?: number
  message?: string
  nickname?: string
  records?: BestRecord[]
}

// 상수표(Google 시트)의 곡 한 줄
export interface ConstantEntry {
  name: string
  pattern: 'NM' | 'HD' | 'MX' | 'SC'
  level: number
  category: string // DLC(팩) 이름
  marks: string // 황배/보조 키/키파트 같은 이모지 표시
  note: string
}

// 같은 상수를 가진 곡들
export interface ConstantGroup {
  constant: string
  entries: ConstantEntry[]
}

export interface ConstantResult {
  success: boolean
  message?: string
  groups?: ConstantGroup[]
  fetchedAt?: number // 시트를 내려받은 시각 (ms)
  stale?: boolean // 새로 받지 못해 오래된 저장본을 보여 주는 중
}

export interface AppSettings {
  screenshotDir: string // 결과창 스크린샷을 감시할 폴더
  watchScreenshots: boolean
  autoUpload: boolean // 모두 인식하면 확인 없이 바로 업로드
}

export interface VerifyAccountResult {
  success: boolean
  checked: boolean // false면 서버에 닿지 못해 확인하지 못했다
  message: string
}

export interface UploadHistoryEntry {
  at: number
  name: string
  button: 4 | 5 | 6 | 8
  pattern: 'NM' | 'HD' | 'MX' | 'SC'
  score: number
  maxCombo: boolean
  status: 'updated' | 'kept' | 'failed'
  message: string
}

export interface CacheInfo {
  jackets: { count: number; bytes: number }
  constantsBytes: number
  historyCount: number
}

export type CacheKind = 'jackets' | 'constants' | 'history'

// 곡 패턴 상세 (패턴 태그 서비스)
export interface SongDetail {
  title: string
  title_index: number
  difficulty: number
  level: number
  pattern: 'NM' | 'HD' | 'MX' | 'SC'
  tags: Record<string, number> // 태그 이름 -> 강도(1~3)
  description?: string
  composer?: string
  dlcCode?: string
  floorName?: string
  sync_created_at?: string
}

export interface SongDetailResult {
  success: boolean
  status?: number
  message?: string
  detail?: SongDetail
}

// 결과창에서 읽은 값. 못 읽은 항목은 undefined
export interface ResultInfo {
  title?: string
  songId?: number // 곡 DB의 title(번호)
  button?: 4 | 5 | 6 | 8
  pattern?: 'NM' | 'HD' | 'MX' | 'SC'
  accuracy?: number
  maxCombo: boolean // MAX COMBO 또는 PERFECT PLAY 뱃지가 있음
  perfectPlay: boolean
}

export interface Api {
  loadData: () => Promise<{
    songs: Song[]
    boards: unknown
    tiers: unknown
  }>
  initNumOCR: () => Promise<void>
  readClipboardImage: () => Promise<Uint8Array | null>
  recognizeResult: (image: Uint8Array) => Promise<ResultInfo>

  setAccount: (account: Account) => Promise<VerifyAccountResult>
  verifyAccount: () => Promise<VerifyAccountResult>
  hasAccount: () => Promise<boolean>
  uploadScore: (req: UploadScoreRequest) => Promise<UploadScoreResult>

  getSettings: () => Promise<AppSettings>
  setSettings: (patch: Partial<AppSettings>) => Promise<AppSettings>
  chooseFolder: () => Promise<string | null>
  onScreenshot: (callback: (shot: { name: string; bytes: Uint8Array }) => void) => () => void

  getUploadHistory: () => Promise<UploadHistoryEntry[]>
  addUploadHistory: (entry: UploadHistoryEntry) => Promise<void>
  clearUploadHistory: () => Promise<void>

  getCacheInfo: () => Promise<CacheInfo>
  clearCache: (kind: CacheKind) => Promise<void> // jackets는 지운 뒤 다시 받을 때까지 기다린다

  getNickname: () => Promise<string>
  setNickname: (nickname: string) => Promise<void>
  loadBest: (button: number) => Promise<BestResult>
  loadRecords: (button: number) => Promise<BestResult> // 기록 전체
  loadConstants: (button: number, force?: boolean) => Promise<ConstantResult>
  getJackets: (ids: number[]) => Promise<Record<number, string>> // 곡 번호 -> data URL
  loadSongDetail: (button: number, songId: number, pattern: string) => Promise<SongDetailResult>

  onJacketProgress: (callback: (progress: { done: number; total: number }) => void) => () => void

  minimize: () => void
  maximize: () => void
  unmaximize: () => void
  close: () => void
  onWindowStateChange: (
    callback: (state: 'maximized' | 'minimized' | 'normal') => void
  ) => () => void
}
