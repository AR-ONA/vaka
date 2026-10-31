import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { PiArrowClockwise } from 'react-icons/pi'
import { BestRecord } from '../../../types/api'
import PageLoading from '../components/PageLoading'
import { useDataStore } from '../store/useDataStore'
import { PATTERN_COLORS } from '../utils/pattern'
import { describeRecordsError } from '../utils/recordsError'

const BUTTONS = [4, 5, 6, 8] as const
type Button = (typeof BUTTONS)[number]

interface ButtonSummary {
  records: BestRecord[]
  error?: string
}

const Meter: React.FC<{ label: string; value: number; total: number }> = ({
  label,
  value,
  total
}) => (
  <div className="grid grid-cols-[6.5rem_1fr] items-center gap-3 text-sm">
    <span className="opacity-80">{label}</span>
    <div className="relative h-5 overflow-hidden rounded bg-(--color-background)">
      <div
        className="absolute inset-y-0 left-0 bg-violet-400/40"
        style={{ width: `${total === 0 ? 0 : (value / total) * 100}%` }}
      />
      <span className="relative flex h-full items-center justify-center text-xs">
        {value} / {total}
      </span>
    </div>
  </div>
)

const ProfilePage: React.FC = () => {
  const [nickname, setNickname] = useState<string>()
  const [hasAccount, setHasAccount] = useState(false)
  const [summaries, setSummaries] = useState<Partial<Record<Button, ButtonSummary>>>({})
  const [loading, setLoading] = useState(true)
  const songs = useDataStore((state) => state.songs)

  const load = useCallback(async (): Promise<void> => {
    setLoading(true)
    const [name, account] = await Promise.all([window.api.getNickname(), window.api.hasAccount()])
    setNickname(name)
    setHasAccount(account)
    if (!name) {
      setSummaries({})
      setLoading(false)
      return
    }

    const entries = await Promise.all(
      BUTTONS.map(async (button): Promise<[Button, ButtonSummary]> => {
        try {
          const result = await window.api.loadRecords(button)
          return result.success
            ? [button, { records: result.records ?? [] }]
            : [button, { records: [], error: describeRecordsError(result) }]
        } catch (e) {
          console.error('기록 조회 실패:', e)
          return [button, { records: [], error: '기록을 불러오지 못했습니다' }]
        }
      })
    )
    setSummaries(Object.fromEntries(entries))
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const totalPatterns = useMemo(() => {
    const result = {} as Record<Button, number>
    for (const button of BUTTONS) {
      const key = `${button}B` as const
      result[button] = songs.reduce(
        (sum, song) => sum + Object.keys(song.patterns[key] ?? {}).length,
        0
      )
    }
    return result
  }, [songs])

  const firstError = Object.values(summaries).find((s) => s?.error)?.error

  return (
    <div className="relative flex h-full flex-col gap-5 overflow-auto p-6">
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-2xl font-semibold">{nickname || '닉네임 없음'}</h2>
          <p className="mt-1 text-sm opacity-60">
            {hasAccount ? '업로드 계정이 설정되어 있습니다' : '업로드 계정이 설정되지 않았습니다'}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          title="새로고침"
          className="rounded p-2 transition-colors hover:bg-(--ev-c-gray-3) disabled:opacity-40"
        >
          <PiArrowClockwise className={`size-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {nickname === '' ? (
        <p className="text-base opacity-70">설정에서 닉네임을 저장하면 기록 요약이 나옵니다</p>
      ) : firstError ? (
        <p className="text-base opacity-70">{firstError}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {BUTTONS.map((button) => {
            const records = summaries[button]?.records ?? []
            const total = totalPatterns[button]
            const top = records.reduce<BestRecord | undefined>(
              (best, r) => (!best || r.djpower > best.djpower ? r : best),
              undefined
            )
            return (
              <section
                key={button}
                className="space-y-2.5 rounded-xl bg-(--color-background-soft) p-4"
              >
                <h3 className="text-lg font-semibold">{button}B</h3>
                <Meter
                  label="Perfect"
                  value={records.filter((r) => r.score >= 100).length}
                  total={total}
                />
                <Meter
                  label="Max Combo"
                  value={records.filter((r) => r.maxCombo).length}
                  total={total}
                />
                <Meter label="Clear" value={records.length} total={total} />
                <p className="flex items-center gap-2 pt-1 text-sm">
                  <span className="opacity-60">최고 DJ POWER</span>
                  {top ? (
                    <>
                      <span className="min-w-0 truncate">{top.name}</span>
                      <span
                        className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${PATTERN_COLORS[top.pattern]}`}
                      >
                        {top.pattern}
                      </span>
                      <span className="shrink-0 opacity-80">{top.djpower.toFixed(3)}</span>
                    </>
                  ) : (
                    <span className="opacity-40">-</span>
                  )}
                </p>
              </section>
            )
          })}
        </div>
      )}
      <PageLoading show={loading && Object.keys(summaries).length === 0 && nickname !== ''} />
    </div>
  )
}

export default ProfilePage
