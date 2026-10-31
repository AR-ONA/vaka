import { app, ipcMain } from 'electron'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs'
import { join } from 'path'
import { UploadHistoryEntry } from '../../types/api'

const HISTORY_FILE = 'upload-history.json'
const MAX_ENTRIES = 100

const historyPath = (): string => join(app.getPath('userData'), HISTORY_FILE)

export function readHistory(): UploadHistoryEntry[] {
  try {
    const data = JSON.parse(readFileSync(historyPath(), 'utf-8'))
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

export function clearHistory(): void {
  rmSync(historyPath(), { force: true })
}

export function registerHistoryIPC(): void {
  ipcMain.handle('get-upload-history', (): UploadHistoryEntry[] => readHistory())

  // 최근 것이 앞에 온다
  ipcMain.handle('add-upload-history', (_, entry: UploadHistoryEntry): void => {
    const next = [entry, ...readHistory()].slice(0, MAX_ENTRIES)
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(historyPath(), JSON.stringify(next))
  })

  ipcMain.handle('clear-upload-history', (): void => clearHistory())
}
