import { registerApiIPC } from './api'
import { registerSystemIPC } from './system'

export function registerAllIPC(): void {
  registerSystemIPC()
  registerApiIPC()
}
