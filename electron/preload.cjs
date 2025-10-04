const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("window:minimize"),
  maximize: () => ipcRenderer.send("window:maximize"),
  close: () => ipcRenderer.send("window:close"),
  fetchSongs: () => ipcRenderer.invoke("fetch-songs"),
  fetchTiers: () => ipcRenderer.invoke("fetch-tiers"),
  fetchBoards: () => ipcRenderer.invoke("fetch-boards"),
});