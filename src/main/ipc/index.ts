import { registerApiIPC } from './api'
import { registerOcrIPC } from './ocr'
import { registerSystemIPC } from './system'

export function registerAllIPC(): void {
  registerSystemIPC()
  registerApiIPC()
  registerOcrIPC()
}
