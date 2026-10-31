import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { Api } from '../types/api'

// Custom APIs for renderer
const api: Api = {
  loadData: () => ipcRenderer.invoke('load-data'),
  initNumOCR: () => ipcRenderer.invoke('init-num-ocr'),
  readClipboardImage: () => ipcRenderer.invoke('read-clipboard-image'),
  recognizeResult: (image) => ipcRenderer.invoke('recognize-result', image),

  setAccount: (account) => ipcRenderer.invoke('set-account', account),
  verifyAccount: () => ipcRenderer.invoke('verify-account'),
  hasAccount: () => ipcRenderer.invoke('has-account'),
  uploadScore: (req) => ipcRenderer.invoke('upload-score', req),

  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (patch) => ipcRenderer.invoke('set-settings', patch),
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  onScreenshot: (callback) => {
    const listener = (_: unknown, shot: { name: string; bytes: Uint8Array }): void => callback(shot)
    ipcRenderer.on('screenshot-detected', listener)

    return () => {
      ipcRenderer.removeListener('screenshot-detected', listener)
    }
  },

  getUploadHistory: () => ipcRenderer.invoke('get-upload-history'),
  addUploadHistory: (entry) => ipcRenderer.invoke('add-upload-history', entry),
  clearUploadHistory: () => ipcRenderer.invoke('clear-upload-history'),

  getCacheInfo: () => ipcRenderer.invoke('get-cache-info'),
  clearCache: (kind) => ipcRenderer.invoke('clear-cache', kind),

  getNickname: () => ipcRenderer.invoke('get-nickname'),
  setNickname: (nickname) => ipcRenderer.invoke('set-nickname', nickname),
  loadBest: (button) => ipcRenderer.invoke('load-best', button),
  loadRecords: (button) => ipcRenderer.invoke('load-records', button),
  loadConstants: (button, force) => ipcRenderer.invoke('load-constants', button, force),
  getJackets: (ids) => ipcRenderer.invoke('get-jackets', ids),
  loadSongDetail: (button, songId, pattern) =>
    ipcRenderer.invoke('load-song-detail', button, songId, pattern),

  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  unmaximize: () => ipcRenderer.invoke('window-unmaximize'),
  close: () => ipcRenderer.invoke('window-close'),

  onJacketProgress: (
    callback: (progress: { done: number; total: number }) => void
  ): (() => void) => {
    const listener = (_: unknown, progress: { done: number; total: number }): void =>
      callback(progress)
    ipcRenderer.on('jacket-progress', listener)

    return () => {
      ipcRenderer.removeListener('jacket-progress', listener)
    }
  },

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
