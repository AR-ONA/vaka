import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PiArrowClockwise } from 'react-icons/pi'
import { BestRecord } from '../../../types/api'
import FloorStars from '../components/FloorStars'
import PageLoading from '../components/PageLoading'
import { useListFade } from '../hooks/useListFade'
import { useDataStore } from '../store/useDataStore'
import { HIGHEST_CONDITIONS, findHighest } from '../utils/highestRecord'
import { PATTERN_COLORS } from '../utils/pattern'
import { describeRecordsError } from '../utils/recordsError'

const BUTTONS = [4, 5, 6, 8] as const

const StatRow: React.FC<{ label: string; value: number; total: number }> = ({
  label,
  value,
  total
}) => (
  <div className="grid grid-cols-[9rem_1fr] items-center gap-4 text-base">
    <span className="font-semibold">{label}</span>
    <div className="relative h-6 overflow-hidden rounded bg-(--color-background-soft)">
      <div
        className="absolute inset-y-0 left-0 bg-violet-400/40"
        style={{ width: `${total === 0 ? 0 : (value / total) * 100}%` }}
      />
      <span className="relative flex h-full items-center justify-center text-sm">
        {value} / {total}
      </span>
    </div>
  </div>
)

const SummaryPage: React.FC = () => {
  const [button, setButton] = useState<(typeof BUTTONS)[number]>(4)
  const [records, setRecords] = useState<BestRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const { listRef, className: listFadeClass, fadeOut, fadeIn } = useListFade()
  const songs = useDataStore((state) => state.songs)

  // refresh: 새로고침. 탭을 바꿀 때는 이전 내용을 서서히 지우고 새 내용으로 바꾼다
  const load = useCallback(
    async (refresh = false): Promise<void> => {
      const id = ++requestId.current
      const waitFadeOut = refresh ? undefined : fadeOut()
      setLoading(true)
      setError('')
      try {
        const result = await window.api.loadRecords(button)
        await waitFadeOut?.()
        if (id !== requestId.current) return // 그 사이 다른 탭을 눌렀다
        if (result.success) setRecords(result.records ?? [])
        else {
          setRecords([])
          setError(describeRecordsError(result))
        }
      } catch (e) {
        await waitFadeOut?.()
        if (id !== requestId.current) return
        console.error('기록 조회 실패:', e)
        setRecords([])
        setError(`기록을 불러오지 못했습니다 (${e instanceof Error ? e.message : String(e)})`)
      } finally {
        if (id === requestId.current) {
          setLoading(false)
          if (!refresh) fadeIn()
        }
      }
    },
    [button, fadeOut, fadeIn]
  )

  useEffect(() => {
    load()
  }, [load])

  // 이 버튼 수의 전체 패턴 수
  const totalPatterns = useMemo(() => {
    const key = `${button}B` as const
    return songs.reduce((sum, song) => sum + Object.keys(song.patterns[key] ?? {}).length, 0)
  }, [songs, button])

  const totals = useMemo(
    () => ({
      perfect: records.filter((r) => r.score >= 100).length,
      maxCombo: records.filter((r) => r.maxCombo).length,
      clear: records.length
    }),
    [records]
  )

  const highest = useMemo(
    () =>
      HIGHEST_CONDITIONS.map(({ label, test }) => ({ label, record: findHighest(records, test) })),
    [records]
  )

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        {BUTTONS.map((b) => (
          <button
            key={b}
            onClick={() => setButton(b)}
            className={`rounded-lg px-4 py-1.5 text-base transition-colors ${
              b === button
                ? 'bg-(--ev-c-gray-3)'
                : 'bg-(--color-background-soft) opacity-70 hover:opacity-100'
            }`}
          >
            {b}B
          </button>
        ))}
        <div className="flex-1" />
        <button
          onClick={() => load(true)}
          disabled={loading}
          title="새로고침"
          className="rounded p-2 transition-colors hover:bg-(--ev-c-gray-3) disabled:opacity-40"
        >
          <PiArrowClockwise className={`size-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 flex-col">
        {error ? (
          <p className="text-base opacity-70">{error}</p>
        ) : records.length === 0 ? (
          loading ? null : (
            <p className="text-base opacity-70">{button}B 기록이 없습니다</p>
          )
        ) : (
          <div
            ref={listRef}
            className={`min-h-0 flex-1 overflow-auto rounded-xl border border-(--ev-c-gray-3) pr-0 ${listFadeClass}`}
          >
            <div className="px-5 py-4">
              <h3 className="mb-5 text-xl font-semibold">Highest Record</h3>
              <div className="flex flex-col gap-2.5">
                {highest.map(({ label, record }) => (
                  <div key={label} className="grid grid-cols-[8rem_7rem_1fr] items-center gap-2">
                    <span className="text-base font-semibold">{label}</span>
                    {record && record.floorName ? (
                      <>
                        <span className="flex items-center gap-2 text-base font-semibold">
                          <span
                            className={`rounded px-1.5 py-0.5 text-xs ${PATTERN_COLORS[record.pattern]}`}
                          >
                            {record.pattern}
                          </span>
                          {record.floorName}
                        </span>
                        <FloorStars floorName={record.floorName} />
                      </>
                    ) : (
                      <span className="opacity-40">-</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2 border-t border-(--ev-c-gray-3) px-5 py-4">
              <StatRow label="Total Perfect" value={totals.perfect} total={totalPatterns} />
              <StatRow label="Total Max Combo" value={totals.maxCombo} total={totalPatterns} />
              <StatRow label="Total Clear" value={totals.clear} total={totalPatterns} />
            </div>
          </div>
        )}
        <PageLoading show={loading && records.length === 0} />
      </div>
    </div>
  )
}

export default SummaryPage
