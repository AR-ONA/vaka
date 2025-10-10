import { app, BrowserWindow, ipcMain } from 'electron'

export function registerSystemIPC(mainWindow: BrowserWindow): void {
  ipcMain.handle('get-app-version', (): string => app.getVersion())
  ipcMain.handle('quit-app', (): void => app.quit())

  ipcMain.handle('window-minimize', (): void => mainWindow.minimize())
  ipcMain.handle('window-maximize', (): void => mainWindow.maximize())
  ipcMain.handle('window-unmaximize', (): void => mainWindow.unmaximize())
  ipcMain.handle('window-close', (): void => mainWindow.close())

  const sendWindowState = (): void => {
    if (!mainWindow) return
    let state: 'maximized' | 'minimized' | 'normal' = 'normal'
    if (mainWindow.isMaximized()) state = 'maximized'
    else if (mainWindow.isMinimized()) state = 'minimized'
    mainWindow.webContents.send('window-state-changed', state)
  }

  mainWindow.on('maximize', sendWindowState)
  mainWindow.on('unmaximize', sendWindowState)
  mainWindow.on('minimize', sendWindowState)
  mainWindow.on('restore', sendWindowState)
}
