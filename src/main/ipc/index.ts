import { BrowserWindow } from 'electron'
import { registerApiIPC } from './api'
import { registerOcrIPC } from './ocr'
import { registerSystemIPC } from './system'

export function registerAllIPC(mainWindow: BrowserWindow): void {
  registerSystemIPC(mainWindow)
  registerApiIPC()
  registerOcrIPC()
}
