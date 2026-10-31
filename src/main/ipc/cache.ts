import { app, ipcMain } from 'electron'
import { existsSync, readdirSync, statSync } from 'fs'
import { join } from 'path'
import { CacheInfo, CacheKind } from '../../types/api'
import { jacketDir, reloadJackets } from '../ocr/data/albumArtData'
import { clearConstantsCache } from './constants'
import { clearHistory, readHistory } from './history'

function getCacheInfo(): CacheInfo {
  let count = 0
  let bytes = 0
  try {
    for (const name of readdirSync(jacketDir())) {
      count++
      bytes += statSync(join(jacketDir(), name)).size
    }
  } catch {
    // 아직 받은 자켓이 없다
  }

  const constantsFile = join(app.getPath('userData'), 'constants-cache.json')
  return {
    jackets: { count, bytes },
    constantsBytes: existsSync(constantsFile) ? statSync(constantsFile).size : 0,
    historyCount: readHistory().length
  }
}

export function registerCacheIPC(): void {
  ipcMain.handle('get-cache-info', (): CacheInfo => getCacheInfo())

  ipcMain.handle('clear-cache', async (event, kind: CacheKind): Promise<void> => {
    if (kind === 'constants') return clearConstantsCache()
    if (kind === 'history') return clearHistory()

    await reloadJackets((done, total) => event.sender.send('jacket-progress', { done, total }))
  })
}
