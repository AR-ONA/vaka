const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 1000,
    height: 700,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
    },
  })

  // Vite
  win.loadURL('http://localhost:5173')
}

app.whenReady().then(() => {
  createWindow()
})

ipcMain.on("window:minimize", () => win.minimize());
ipcMain.on("window:maximize", () => {
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});
ipcMain.on("window:close", () => win.close());

ipcMain.handle("fetch-songs", async () => {
  return (await fetch("https://v-archive.net/db/songs.json")).json();
});
ipcMain.handle("fetch-tiers", async () => {
  return (await fetch("https://v-archive.net/db/songs.json")).json();
});
ipcMain.handle("fetch-boards", async () => {
  return (await fetch("https://v-archive.net/db/songs.json")).json();
});