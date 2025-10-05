import { app, ipcMain } from 'electron'

export function registerSystemIPC(): void {
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  ipcMain.handle('quit-app', () => {
    app.quit()
  })
}
