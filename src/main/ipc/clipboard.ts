import { clipboard, ipcMain } from 'electron'
import { readFileSync } from 'fs'
import { extname } from 'path'
import { fileURLToPath } from 'url'

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.bmp', '.webp']

// 파일 관리자에서 파일 자체를 복사했을 때 클립보드에 든 파일 경로들
function readCopiedFilePaths(): string[] {
  if (process.platform === 'win32') {
    const path = clipboard.readBuffer('FileNameW').toString('ucs2').replace(/\0/g, '')
    return path ? [path] : []
  }

  // uri-list는 줄마다 경로, gnome-copied-files는 첫 줄이 copy/cut이라 file:// 줄만 고른다
  return ['text/uri-list', 'x-special/gnome-copied-files']
    .flatMap((format) => clipboard.readBuffer(format).toString().split(/\r?\n/))
    .filter((line) => line.startsWith('file://'))
    .map((line) => fileURLToPath(line))
}

function readClipboardImage(): Uint8Array | null {
  const image = clipboard.readImage()
  if (!image.isEmpty()) return image.toPNG()

  const path = readCopiedFilePaths().find((p) =>
    IMAGE_EXTENSIONS.includes(extname(p).toLowerCase())
  )
  return path ? readFileSync(path) : null
}

export function registerClipboardIPC(): void {
  ipcMain.handle('read-clipboard-image', (): Uint8Array | null => {
    try {
      return readClipboardImage()
    } catch (error) {
      console.error('Failed to read clipboard:', error)
      return null
    }
  })
}
