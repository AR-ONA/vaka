import { BrowserWindow } from 'electron'
import { FSWatcher, statSync, watch } from 'fs'
import { readFile } from 'fs/promises'
import { join } from 'path'

const IMAGE_FILE = /\.(png|jpe?g|bmp|webp)$/i
const DEBOUNCE_MS = 400
const STABLE_POLL_MS = 300
const STABLE_TIMEOUT_MS = 5_000
const MAX_BYTES = 30 * 1024 * 1024

let watcher: FSWatcher | undefined
const timers = new Map<string, NodeJS.Timeout>()
const handled = new Map<string, number>() // 파일 이름 -> 보낸 시점의 수정 시각

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

// 게임이 파일을 다 쓸 때까지 (크기가 두 번 연속 같을 때까지) 기다린다
async function waitUntilStable(path: string): Promise<boolean> {
  let last = -1
  for (let waited = 0; waited < STABLE_TIMEOUT_MS; waited += STABLE_POLL_MS) {
    try {
      const size = statSync(path).size
      if (size > 0 && size === last) return true
      last = size
    } catch {
      return false
    }
    await sleep(STABLE_POLL_MS)
  }
  return false
}

async function handle(win: BrowserWindow, dir: string, name: string): Promise<void> {
  const path = join(dir, name)
  if (!(await waitUntilStable(path))) return

  try {
    const { mtimeMs, size } = statSync(path)
    if (size > MAX_BYTES || handled.get(name) === mtimeMs) return
    handled.set(name, mtimeMs)
    const bytes = new Uint8Array(await readFile(path))
    if (!win.isDestroyed()) win.webContents.send('screenshot-detected', { name, bytes })
  } catch (error) {
    console.error('Failed to read screenshot:', error)
  }
}

// dir이 null이면 감시를 끈다
export function configureScreenshotWatcher(win: BrowserWindow, dir: string | null): void {
  watcher?.close()
  watcher = undefined
  for (const timer of timers.values()) clearTimeout(timer)
  timers.clear()
  if (!dir) return

  try {
    watcher = watch(dir, (_, name) => {
      if (!name || !IMAGE_FILE.test(name)) return
      clearTimeout(timers.get(name))
      timers.set(
        name,
        setTimeout(() => {
          timers.delete(name)
          handle(win, dir, name)
        }, DEBOUNCE_MS)
      )
    })
    watcher.on('error', (error) => console.error('Screenshot watcher error:', error))
    console.log('Watching screenshots:', dir)
  } catch (error) {
    console.error('Failed to watch screenshot folder:', error)
  }
}
