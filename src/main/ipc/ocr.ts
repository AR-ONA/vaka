import { ipcMain } from 'electron'
import { initNumOCR } from '../ocr/process/numOCR'
import { recognizeResult } from '../ocr/process/resultOCR'

export function registerOcrIPC(): void {
  ipcMain.handle('init-num-ocr', async () => {
    await initNumOCR()
  })

  ipcMain.handle('recognize-result', (_, image: Uint8Array) => recognizeResult(Buffer.from(image)))
}
