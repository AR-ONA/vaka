import { app, ipcMain, safeStorage } from 'electron'
import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import {
  Account,
  UploadScoreRequest,
  UploadScoreResult,
  VerifyAccountResult
} from '../../types/api'

const ACCOUNT_FILE = 'account.json'
const UPLOAD_TIMEOUT = 10_000

const PATTERN_NAMES = { NM: 'NORMAL', HD: 'HARD', MX: 'MAXIMUM', SC: 'SC' } as const

interface AccountFile {
  userNo: number
  token: string // safeStorage로 암호화한 base64
}

function getAccountPath(): string {
  return join(app.getPath('userData'), ACCOUNT_FILE)
}

function saveAccount({ userNo, token }: Account): void {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('토큰을 안전하게 저장할 수 없는 환경입니다')
  }
  const data: AccountFile = {
    userNo,
    token: safeStorage.encryptString(token).toString('base64')
  }
  mkdirSync(app.getPath('userData'), { recursive: true })
  writeFileSync(getAccountPath(), JSON.stringify(data))
}

function loadAccount(): Account | null {
  try {
    const data = JSON.parse(readFileSync(getAccountPath(), 'utf-8')) as AccountFile
    const token = safeStorage.decryptString(Buffer.from(data.token, 'base64'))
    return { userNo: data.userNo, token }
  } catch {
    return null
  }
}

// 기록을 만들지 않는 빈 요청을 보내 토큰이 맞는지만 확인한다
// 토큰이 틀리면 401(errorCode 21/22), 맞으면 입력값 오류로 거절된다
async function verifyAccount(account: Account): Promise<VerifyAccountResult> {
  try {
    const resp = await fetch(`https://v-archive.net/client/open/${account.userNo}/score`, {
      method: 'POST',
      headers: { Authorization: account.token, 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT)
    })
    if (resp.status === 401 || resp.status === 403) {
      return {
        success: false,
        checked: true,
        message: 'USER_NO 또는 API_TOKEN이 올바르지 않습니다'
      }
    }
    if (resp.status >= 500) {
      return { success: true, checked: false, message: 'V-Archive 서버 오류로 확인하지 못했습니다' }
    }
    return { success: true, checked: true, message: '계정을 확인했습니다' }
  } catch (error) {
    console.error('Failed to verify account:', error)
    return { success: true, checked: false, message: '서버에 연결하지 못해 확인하지 못했습니다' }
  }
}

async function uploadScore(req: UploadScoreRequest): Promise<UploadScoreResult> {
  const account = loadAccount()
  if (!account) return { success: false, message: '계정 정보가 설정되지 않았습니다' }

  const payload = {
    name: req.name,
    button: req.button,
    pattern: PATTERN_NAMES[req.pattern],
    score: req.score,
    maxCombo: req.maxCombo ? 1 : 0,
    ...(req.dlc && { dlc: req.dlc }),
    ...(req.composer && { composer: req.composer })
  }

  try {
    const resp = await fetch(`https://v-archive.net/client/open/${account.userNo}/score`, {
      method: 'POST',
      headers: { Authorization: account.token, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT)
    })
    const text = await resp.text()
    let body: Record<string, unknown> = {}
    try {
      body = JSON.parse(text)
    } catch {
      body = { message: text.slice(0, 200) }
    }

    const success = resp.ok && body.success !== false
    console.log('Upload response:', resp.status, payload, text.slice(0, 500))
    return { ...body, success, status: resp.status }
  } catch (error) {
    console.error('Failed to upload score:', error)
    const reason = error instanceof Error ? error.message : String(error)
    return { success: false, message: `업로드 요청에 실패했습니다 (${reason})` }
  }
}

export function registerUploadIPC(): void {
  // 틀린 계정은 저장하지 않는다. 서버에 닿지 못했을 때는 저장하고 확인하지 못했다고 알린다
  ipcMain.handle('set-account', async (_, account: Account): Promise<VerifyAccountResult> => {
    const result = await verifyAccount(account)
    if (!result.success) return result
    try {
      saveAccount(account)
    } catch (error) {
      return {
        success: false,
        checked: result.checked,
        message: error instanceof Error ? error.message : '저장하지 못했습니다'
      }
    }
    return {
      ...result,
      message: result.checked
        ? '저장했습니다. 계정을 확인했습니다'
        : `저장했습니다. ${result.message}`
    }
  })
  ipcMain.handle('verify-account', async (): Promise<VerifyAccountResult> => {
    const account = loadAccount()
    if (!account) return { success: false, checked: true, message: '저장된 계정이 없습니다' }
    return verifyAccount(account)
  })
  ipcMain.handle('has-account', (): boolean => loadAccount() !== null)
  ipcMain.handle('upload-score', (_, req: UploadScoreRequest) => uploadScore(req))
}
