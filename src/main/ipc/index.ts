import { BrowserWindow } from 'electron'
import { registerApiIPC } from './api'
import { registerCacheIPC } from './cache'
import { registerClipboardIPC } from './clipboard'
import { registerConstantsIPC } from './constants'
import { registerHistoryIPC } from './history'
import { registerJacketsIPC } from './jackets'
import { registerOcrIPC } from './ocr'
import { registerRecordsIPC } from './records'
import { registerSettingsIPC } from './settings'
import { registerSongDetailIPC } from './songDetail'
import { registerSystemIPC } from './system'
import { registerUploadIPC } from './upload'

export function registerAllIPC(mainWindow: BrowserWindow): void {
  registerSystemIPC(mainWindow)
  registerApiIPC()
  registerOcrIPC()
  registerUploadIPC()
  registerClipboardIPC()
  registerRecordsIPC()
  registerConstantsIPC()
  registerJacketsIPC()
  registerSongDetailIPC()
  registerSettingsIPC(mainWindow)
  registerHistoryIPC()
  registerCacheIPC()
}
