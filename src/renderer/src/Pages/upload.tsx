import React, { useCallback, useEffect, useState } from 'react'
import { UploadHistoryEntry, UploadScoreRequest } from '../../../types/api'
import UploadHistory from '../components/UploadHistory'
import { useDataStore } from '../store/useDataStore'
import { usePendingShot } from '../store/usePendingShot'
import { describeUploadResult, uploadStatus } from '../utils/uploadMessage'

const BUTTONS = [4, 5, 6, 8] as const
const PATTERNS = ['NM', 'HD', 'MX', 'SC'] as const

const fieldClass =
  'w-full rounded bg-[var(--color-background-soft)] px-3 py-2 text-base text-[var(--color-text)] outline-none focus:ring-1 focus:ring-[var(--ev-c-gray-3)]'

interface Form {
  title: string
  button: UploadScoreRequest['button'] | ''
  pattern: UploadScoreRequest['pattern'] | ''
  accuracy: string
  maxCombo: boolean
  perfectPlay: boolean
}

// 인식 실패
type ManualFields = Record<'title' | 'button' | 'pattern' | 'accuracy', boolean>
const NO_MANUAL: ManualFields = { title: false, button: false, pattern: false, accuracy: false }

const EMPTY_FORM: Form = {
  title: '',
  button: '',
  pattern: '',
  accuracy: '',
  maxCombo: false,
  perfectPlay: false
}

const mimeOf = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg'
  if (ext === 'webp') return 'image/webp'
  if (ext === 'bmp') return 'image/bmp'
  return 'image/png'
}

interface Submission {
  name: string
  button: UploadScoreRequest['button']
  pattern: UploadScoreRequest['pattern']
  score: number
  maxCombo: boolean
}

const UploadPage: React.FC = () => {
  const [previewUrl, setPreviewUrl] = useState('')
  const [form, setForm] = useState<Form>(EMPTY_FORM)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [songId, setSongId] = useState<number>()
  const [manual, setManual] = useState<ManualFields>(NO_MANUAL)
  const songs = useDataStore((state) => state.songs)
  const [tab, setTab] = useState<'upload' | 'history'>('upload')
  const [history, setHistory] = useState<UploadHistoryEntry[]>([])
  const shot = usePendingShot((state) => state.shot)
  const setShot = usePendingShot((state) => state.setShot)

  const refreshHistory = useCallback((): void => {
    window.api.getUploadHistory().then(setHistory)
  }, [])

  useEffect(refreshHistory, [refreshHistory])

  // 서버에 올리고 기록에 남긴 뒤 사용자에게 보여 줄 문장을 돌려준다
  const submit = useCallback(
    async (values: Submission, songId?: number): Promise<string> => {
      const name = values.name.trim()
      const sameName = songs.filter((song) => song.name === name)
      const song =
        sameName.find((song) => song.title === songId) ??
        (sameName.length === 1 ? sameName[0] : undefined)

      const req: UploadScoreRequest = {
        ...values,
        name,
        ...(song && { dlc: song.dlc, composer: song.composer })
      }
      const result = await window.api.uploadScore(req)
      const message = describeUploadResult(result, req)
      await window.api
        .addUploadHistory({
          at: Date.now(),
          name,
          button: req.button,
          pattern: req.pattern,
          score: req.score,
          maxCombo: req.maxCombo,
          status: uploadStatus(result),
          message
        })
        .catch((e) => console.error('업로드 기록 저장 실패:', e))
      refreshHistory()
      return message
    },
    [songs, refreshHistory]
  )

  const recognize = useCallback(
    async (file: File): Promise<void> => {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      setBusy(true)
      setMessage('')
      try {
        const info = await window.api.recognizeResult(new Uint8Array(await file.arrayBuffer()))
        setSongId(info.songId)
        setForm({
          title: info.title ?? '',
          button: info.button ?? '',
          pattern: info.pattern ?? '',
          accuracy: info.accuracy?.toString() ?? '',
          maxCombo: info.maxCombo,
          perfectPlay: info.perfectPlay
        })
        const missing: ManualFields = {
          title: !info.title,
          button: !info.button,
          pattern: !info.pattern,
          accuracy: info.accuracy === undefined
        }
        setManual(missing)
        const incomplete = Object.values(missing).some(Boolean)
        setMessage(
          incomplete
            ? '인식에 실패했습니다. 수동으로 입력하세요.'
            : '업로드하려면 업로드 버튼을 누르세요.'
        )

        // 모두 인식했고 자동 업로드가 켜져 있으면 바로 올린다
        if (
          !incomplete &&
          info.title &&
          info.button &&
          info.pattern &&
          info.accuracy !== undefined
        ) {
          const [settings, hasAccount] = await Promise.all([
            window.api.getSettings(),
            window.api.hasAccount()
          ])
          if (settings.autoUpload && hasAccount) {
            setMessage('자동 업로드 중...')
            const result = await submit(
              {
                name: info.title,
                button: info.button,
                pattern: info.pattern,
                score: info.accuracy,
                maxCombo: info.maxCombo
              },
              info.songId
            )
            setMessage(`자동 업로드: ${result}`)
          }
        }
      } catch (error) {
        console.error('결과창 인식 실패:', error)
        setMessage('이미지를 인식하지 못했습니다')
      } finally {
        setBusy(false)
      }
    },
    [submit]
  )

  // 폴더 감시로 들어온 스크린샷
  useEffect(() => {
    if (!shot) return
    setShot(null)
    setTab('upload')
    recognize(new File([new Uint8Array(shot.bytes)], shot.name, { type: mimeOf(shot.name) }))
  }, [shot, setShot, recognize])

  // 클립보드 붙여넣기
  useEffect(() => {
    const onPaste = async (e: ClipboardEvent): Promise<void> => {
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'))
      if (file) return recognize(file)

      const bytes = await window.api.readClipboardImage()
      if (bytes)
        return recognize(new File([new Uint8Array(bytes)], 'clipboard.png', { type: 'image/png' }))

      setMessage(`클립보드에서 이미지를 찾지 못했습니다.`)
    }
    const preventDefault = (e: DragEvent): void => e.preventDefault()

    window.addEventListener('paste', onPaste)
    window.addEventListener('dragover', preventDefault)
    window.addEventListener('drop', preventDefault)
    return () => {
      window.removeEventListener('paste', onPaste)
      window.removeEventListener('dragover', preventDefault)
      window.removeEventListener('drop', preventDefault)
    }
  }, [recognize])

  const onDrop = (e: React.DragEvent): void => {
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'))
    if (file) recognize(file)
  }

  const accuracy = Number(form.accuracy)
  const canUpload =
    !busy &&
    form.title.trim() !== '' &&
    form.button !== '' &&
    form.pattern !== '' &&
    form.accuracy.trim() !== '' &&
    accuracy >= 0 &&
    accuracy <= 100

  const upload = async (): Promise<void> => {
    if (form.button === '' || form.pattern === '') return

    setBusy(true)
    setMessage('업로드 중...')
    try {
      setMessage(
        await submit(
          {
            name: form.title,
            button: form.button,
            pattern: form.pattern,
            score: accuracy,
            maxCombo: form.maxCombo
          },
          songId
        )
      )
    } catch (error) {
      console.error('업로드 실패:', error)
      setMessage(`업로드 실패: ${error instanceof Error ? error.message : String(error)}`)
    } finally {
      setBusy(false)
    }
  }

  // 인식한 값은 텍스트, 인식하지 못한 값은 입력 가능
  // 인식한 값은 고칠 수 없는 텍스트로, 인식하지 못한 값은 입력 컨트롤로 보여 준다
  const field = (
    label: string,
    value: string,
    control?: React.ReactNode | false
  ): React.ReactNode => (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-sm opacity-60">{label}</span>
      {control || (
        <span className={`truncate text-lg ${value ? '' : 'opacity-40'}`}>{value || '-'}</span>
      )}
    </div>
  )

  return (
    <div
      className="flex min-h-full justify-center p-6"
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
    >
      <div className="flex w-full max-w-lg flex-col gap-4">
        <div className="flex gap-2">
          {(
            [
              ['upload', '업로드'],
              ['history', `기록${history.length > 0 ? ` ${history.length}` : ''}`]
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-4 py-1.5 text-base transition-colors ${
                tab === key
                  ? 'bg-(--ev-c-gray-3)'
                  : 'bg-(--color-background-soft) opacity-70 hover:opacity-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className={`flex flex-1 flex-col gap-4 ${tab === 'upload' ? 'justify-center' : ''}`}>
          {tab === 'history' ? (
            <UploadHistory
              entries={history}
              onClear={() => window.api.clearUploadHistory().then(refreshHistory)}
            />
          ) : (
            <>
              <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-dashed border-(--ev-c-gray-3) text-base opacity-80">
                {previewUrl ? (
                  <img src={previewUrl} alt="결과창" className="h-full w-full object-contain" />
                ) : (
                  <p className="px-4 text-center">
                    결과 이미지를 끌어다 놓거나
                    <br />
                    Ctrl + V로 붙여넣으십시오
                  </p>
                )}
              </div>

              {field(
                '곡',
                form.title,
                manual.title && (
                  <input
                    className={fieldClass}
                    placeholder="곡 이름"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                )
              )}

              <div className="grid grid-cols-3 gap-4">
                {field(
                  '버튼',
                  form.button === '' ? '' : `${form.button}B`,
                  manual.button && (
                    <select
                      className={fieldClass}
                      value={form.button}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          button: e.target.value === '' ? '' : (Number(e.target.value) as 4)
                        })
                      }
                    >
                      <option value="">선택</option>
                      {BUTTONS.map((b) => (
                        <option key={b} value={b}>
                          {b}B
                        </option>
                      ))}
                    </select>
                  )
                )}
                {field(
                  '패턴',
                  form.pattern,
                  manual.pattern && (
                    <select
                      className={fieldClass}
                      value={form.pattern}
                      onChange={(e) =>
                        setForm({ ...form, pattern: e.target.value as Form['pattern'] })
                      }
                    >
                      <option value="">선택</option>
                      {PATTERNS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  )
                )}
                {field(
                  '정확도',
                  form.accuracy === '' ? '' : `${form.accuracy}%`,
                  manual.accuracy && (
                    <input
                      className={fieldClass}
                      inputMode="decimal"
                      placeholder="정확도 (%)"
                      value={form.accuracy}
                      onChange={(e) => setForm({ ...form, accuracy: e.target.value })}
                    />
                  )
                )}
              </div>

              {/* 클리어 뱃지와 안내 메시지 자리. 내용이 없어도 높이를 유지해 화면이 흔들리지 않게 한다 */}
              <div className="flex min-h-8 items-center justify-between gap-4">
                {form.perfectPlay ? (
                  <span className="shrink-0 rounded bg-purple-600 px-3 py-1 text-sm font-semibold text-white">
                    PERFECT PLAY
                  </span>
                ) : form.maxCombo ? (
                  <span className="shrink-0 rounded bg-teal-600 px-3 py-1 text-sm font-semibold text-white">
                    MAX COMBO
                  </span>
                ) : (
                  <span />
                )}
                <p className="text-right text-sm opacity-70">{message}</p>
              </div>

              <button
                onClick={upload}
                disabled={!canUpload}
                className="w-full rounded-lg bg-(--ev-c-gray-3) px-4 py-3 text-base transition-colors enabled:hover:brightness-125 disabled:opacity-40"
              >
                {busy ? '처리 중...' : '업로드'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default UploadPage
