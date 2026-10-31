import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { AppSettings } from '../../types/api'
import { configureScreenshotWatcher } from './screenshotWatcher'

const SETTINGS_FILE = 'settings.json'

const DEFAULTS: AppSettings = { screenshotDir: '', watchScreenshots: false, autoUpload: false }

export function readSettings(): AppSettings {
  try {
    const data = JSON.parse(readFileSync(join(app.getPath('userData'), SETTINGS_FILE), 'utf-8'))
    return {
      screenshotDir: typeof data.screenshotDir === 'string' ? data.screenshotDir : '',
      watchScreenshots: data.watchScreenshots === true,
      autoUpload: data.autoUpload === true
    }
  } catch {
    return { ...DEFAULTS }
  }
}

function applyWatcher(win: BrowserWindow, settings: AppSettings): void {
  const active =
    settings.watchScreenshots && settings.screenshotDir !== '' && existsSync(settings.screenshotDir)
  configureScreenshotWatcher(win, active ? settings.screenshotDir : null)
}

export function registerSettingsIPC(mainWindow: BrowserWindow): void {
  applyWatcher(mainWindow, readSettings())

  ipcMain.handle('get-settings', (): AppSettings => readSettings())

  ipcMain.handle('set-settings', (_, patch: Partial<AppSettings>): AppSettings => {
    const next = { ...readSettings(), ...patch }
    mkdirSync(app.getPath('userData'), { recursive: true })
    writeFileSync(join(app.getPath('userData'), SETTINGS_FILE), JSON.stringify(next))
    applyWatcher(mainWindow, next)
    return next
  })

  ipcMain.handle('choose-folder', async (): Promise<string | null> => {
    const result = await dialog.showOpenDialog(mainWindow, { properties: ['openDirectory'] })
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })
}
