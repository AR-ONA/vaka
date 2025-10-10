import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Api } from '../types/api'

// Custom APIs for renderer
const api: Api = {
  loadData: () => ipcRenderer.invoke('load-data'),
  initNumOCR: () => ipcRenderer.invoke('init-num-ocr'),

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
  close: () => ipcRenderer.invoke('window-close'),

  onWindowStateChange: (
    callback: (state: 'maximized' | 'minimized' | 'normal') => void
  ): (() => void) => {
    const listener = (_: unknown, state: 'maximized' | 'minimized' | 'normal'): void =>
      callback(state)
    ipcRenderer.on('window-state-changed', listener)

    return () => {
      ipcRenderer.removeListener('window-state-changed', listener)
    }
  }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
