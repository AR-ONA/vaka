import React, { useEffect, useState } from 'react'
import { AppSettings, CacheInfo, CacheKind } from '../../../types/api'
import { formatBytes } from '../utils/format'

const inputClass =
  'w-full rounded bg-[var(--color-background-soft)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:ring-1 focus:ring-[var(--ev-c-gray-3)]'
const buttonClass =
  'rounded bg-[var(--ev-c-gray-3)] px-4 py-1.5 text-sm transition-colors enabled:hover:brightness-125 disabled:opacity-40'

interface ToggleProps {
  label: string
  description: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}

const Toggle: React.FC<ToggleProps> = ({ label, description, checked, disabled, onChange }) => (
  <label className={`flex items-start gap-3 ${disabled ? 'opacity-40' : 'cursor-pointer'}`}>
    <input
      type="checkbox"
      className="mt-1 size-4 accent-violet-400"
      checked={checked}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
    />
    <span>
      <span className="block text-sm">{label}</span>
      <span className="block text-xs opacity-60">{description}</span>
    </span>
  </label>
)

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section className="space-y-3 border-t border-(--ev-c-gray-3) pt-5 first:border-t-0 first:pt-0">
    <h2 className="text-lg font-semibold">{title}</h2>
    {children}
  </section>
)

const CACHE_LABELS: Record<CacheKind, string> = {
  jackets: '자켓 이미지',
  constants: '상수표',
  history: '업로드 기록'
}

const SettingsPage: React.FC = () => {
  const [userNo, setUserNo] = useState('')
  const [token, setToken] = useState('')
  const [hasAccount, setHasAccount] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [nickname, setNickname] = useState('')
  const [nicknameMessage, setNicknameMessage] = useState('')
  const [settings, setSettings] = useState<AppSettings>()
  const [cacheInfo, setCacheInfo] = useState<CacheInfo>()
  const [cacheMessage, setCacheMessage] = useState('')
  const [cacheBusy, setCacheBusy] = useState(false)

  const refreshCacheInfo = (): void => {
    window.api.getCacheInfo().then(setCacheInfo)
  }

  useEffect(() => {
    window.api.hasAccount().then(setHasAccount)
    window.api.getNickname().then(setNickname)
    window.api.getSettings().then(setSettings)
    refreshCacheInfo()
  }, [])

  const canSave = !busy && /^\d+$/.test(userNo.trim()) && token.trim().length > 0

  const save = async (): Promise<void> => {
    setBusy(true)
    setMessage('확인 중...')
    try {
      const result = await window.api.setAccount({
        userNo: Number(userNo.trim()),
        token: token.trim()
      })
      setMessage(result.message)
      if (result.success) {
        setHasAccount(true)
        setUserNo('')
        setToken('')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '저장하지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  const verify = async (): Promise<void> => {
    setBusy(true)
    setMessage('확인 중...')
    try {
      setMessage((await window.api.verifyAccount()).message)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '확인하지 못했습니다')
    } finally {
      setBusy(false)
    }
  }

  const saveNickname = async (): Promise<void> => {
    try {
      await window.api.setNickname(nickname.trim())
      setNicknameMessage('저장했습니다')
    } catch (error) {
      setNicknameMessage(error instanceof Error ? error.message : '저장하지 못했습니다')
    }
  }

  const update = async (patch: Partial<AppSettings>): Promise<void> => {
    setSettings(await window.api.setSettings(patch))
  }

  const chooseFolder = async (): Promise<void> => {
    const dir = await window.api.chooseFolder()
    if (dir) await update({ screenshotDir: dir, watchScreenshots: true })
  }

  const clearCache = async (kind: CacheKind): Promise<void> => {
    if (
      kind === 'jackets' &&
      !window.confirm('자켓을 모두 지우고 처음부터 다시 받습니다. 계속할까요?')
    )
      return

    setCacheBusy(true)
    setCacheMessage('')
    const off = window.api.onJacketProgress(({ done, total }) =>
      setCacheMessage(`자켓 내려받는 중 ${done} / ${total}`)
    )
    try {
      await window.api.clearCache(kind)
      setCacheMessage(
        kind === 'jackets' ? '자켓을 다시 받았습니다' : `${CACHE_LABELS[kind]}을(를) 지웠습니다`
      )
    } catch (error) {
      setCacheMessage(error instanceof Error ? error.message : '처리하지 못했습니다')
    } finally {
      off()
      setCacheBusy(false)
      refreshCacheInfo()
    }
  }

  return (
    <div className="max-w-md space-y-5 p-4">
      <Section title="V-Archive 계정">
        <p className="text-sm opacity-70">
          {hasAccount
            ? '계정이 저장되어 있습니다. 바꾸려면 다시 입력하세요.'
            : '아직 저장된 계정이 없습니다.'}
        </p>
        <input
          className={inputClass}
          inputMode="numeric"
          placeholder="USER_NO"
          value={userNo}
          onChange={(e) => setUserNo(e.target.value)}
        />
        <input
          className={inputClass}
          type="password"
          placeholder="API_TOKEN"
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button onClick={save} disabled={!canSave} className={buttonClass}>
            저장
          </button>
          <button onClick={verify} disabled={busy || !hasAccount} className={buttonClass}>
            저장된 계정 확인
          </button>
          <span className="text-sm opacity-70">{message}</span>
        </div>
      </Section>

      <Section title="닉네임">
        <p className="text-sm opacity-70">
          베스트와 성과표, 프로필에서 기록을 조회할 때 사용합니다.
        </p>
        <input
          className={inputClass}
          placeholder="V-Archive 닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <div className="flex items-center gap-3">
          <button onClick={saveNickname} disabled={nickname.trim() === ''} className={buttonClass}>
            저장
          </button>
          <span className="text-sm opacity-70">{nicknameMessage}</span>
        </div>
      </Section>

      <Section title="스크린샷 자동 인식">
        <p className="text-sm opacity-70">
          게임 스크린샷이 저장되는 폴더를 지정하면, 새 결과창 이미지가 생길 때 자동으로 인식합니다.
        </p>
        <div className="flex items-center gap-2">
          <span
            className="min-w-0 flex-1 truncate rounded bg-(--color-background-soft) px-3 py-2 text-sm"
            title={settings?.screenshotDir}
          >
            {settings?.screenshotDir || '폴더가 지정되지 않았습니다'}
          </span>
          <button onClick={chooseFolder} className={buttonClass}>
            폴더 선택
          </button>
        </div>
        <Toggle
          label="폴더 감시"
          description="새 이미지가 생기면 업로드 화면에서 인식합니다"
          checked={settings?.watchScreenshots ?? false}
          disabled={!settings?.screenshotDir}
          onChange={(watchScreenshots) => update({ watchScreenshots })}
        />
        <Toggle
          label="자동 업로드"
          description="모두 인식되면 확인 없이 바로 업로드합니다. 잘못 인식된 기록이 올라갈 수 있습니다"
          checked={settings?.autoUpload ?? false}
          onChange={(autoUpload) => update({ autoUpload })}
        />
      </Section>

      <Section title="캐시 관리">
        <ul className="space-y-2 text-sm">
          {(
            [
              [
                'jackets',
                cacheInfo &&
                  `${cacheInfo.jackets.count}장 · ${formatBytes(cacheInfo.jackets.bytes)}`
              ],
              ['constants', cacheInfo && formatBytes(cacheInfo.constantsBytes)],
              ['history', cacheInfo && `${cacheInfo.historyCount}건`]
            ] as const
          ).map(([kind, info]) => (
            <li key={kind} className="flex items-center gap-3">
              <span className="flex-1">
                {CACHE_LABELS[kind]}
                <span className="ml-2 opacity-60">{info}</span>
              </span>
              <button onClick={() => clearCache(kind)} disabled={cacheBusy} className={buttonClass}>
                {kind === 'jackets' ? '지우고 다시 받기' : '지우기'}
              </button>
            </li>
          ))}
        </ul>
        <p className="text-sm opacity-70">{cacheMessage}</p>
      </Section>
    </div>
  )
}

export default SettingsPage
