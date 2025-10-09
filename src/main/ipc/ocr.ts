import { ipcMain } from 'electron'
import { initNumOCR } from '../ocr/process/numOCR'

export function registerOcrIPC(): void {
  ipcMain.handle('init-font-data', async () => {
    await initNumOCR()
  })
}
