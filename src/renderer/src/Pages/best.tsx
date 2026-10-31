import React, { useCallback, useEffect, useRef, useState } from 'react'
import { PiArrowClockwise } from 'react-icons/pi'
import { BestRecord } from '../../../types/api'
import { useListFade } from '../hooks/useListFade'
import PageLoading from '../components/PageLoading'
import { PATTERN_COLORS } from '../utils/pattern'
import { describeRecordsError } from '../utils/recordsError'

const BUTTONS = [4, 5, 6, 8] as const

// 정확도 칸의 색으로 클리어 상태를 나타낸다 (V-Archive와 같은 방식)
function accuracyColor(r: BestRecord): string {
  if (r.score >= 100) return 'bg-red-400/15 text-red-300' // PERFECT PLAY
  if (r.maxCombo) return 'bg-emerald-400/15 text-emerald-300' // MAX COMBO
  return 'bg-sky-400/15 text-sky-300'
}

const BestPage: React.FC = () => {
  const [button, setButton] = useState<(typeof BUTTONS)[number]>(4)
  const [records, setRecords] = useState<BestRecord[]>([])
  const [loading, setLoading] = useState(true) // 첫 화면에 빈 상태가 먼저 보이지 않게
  const [error, setError] = useState('')
  const requestId = useRef(0)
  const { listRef, className: listFadeClass, fadeOut, fadeIn } = useListFade()

  // refresh: 새로고침. 탭을 바꿀 때는 이전 목록을 서서히 지우고 새 목록으로 바꾼다
  const load = useCallback(
    async (refresh = false): Promise<void> => {
      const id = ++requestId.current
      const waitFadeOut = refresh ? undefined : fadeOut()
      setLoading(true)
      setError('')
      try {
        const result = await window.api.loadBest(button)
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
        console.error('베스트 조회 실패:', e)
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
          <div ref={listRef} className={`min-h-0 flex-1 overflow-auto pr-3 ${listFadeClass}`}>
            <table className="w-full table-fixed text-base">
              <thead className="sticky top-0 bg-(--color-background) text-sm opacity-60">
                <tr className="text-left">
                  <th className="w-10 px-2 py-2 font-normal">#</th>
                  <th className="px-2 py-2 font-normal">곡</th>
                  <th className="w-24 px-2 py-2 text-center font-normal">레벨</th>
                  <th className="w-24 px-2 py-2 text-center font-normal">정확도</th>
                  <th className="w-36 px-2 py-2 text-right font-normal">DJ POWER</th>
                </tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr
                    key={`${r.title}-${r.pattern}`}
                    className="border-t border-(--ev-c-gray-3) transition-colors hover:bg-(--color-background-soft)"
                  >
                    <td className="px-2 py-2 opacity-60">{i + 1}</td>
                    <td className="overflow-hidden px-2 py-2">
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-9 shrink-0 rounded py-0.5 text-center text-xs font-semibold ${PATTERN_COLORS[r.pattern]}`}
                        >
                          {r.pattern}
                        </span>
                        <span className="min-w-0 truncate" title={r.name}>
                          {r.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span className="text-lg">{r.level}</span>
                      {r.floorName && (
                        <span className="ml-1 text-sm opacity-50">({r.floorName})</span>
                      )}
                    </td>
                    <td className="px-2 py-2 text-center">
                      <span
                        className={`inline-block w-20 rounded py-0.5 text-center text-sm font-semibold ${accuracyColor(r)}`}
                      >
                        {r.score.toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-2 py-2 text-right">
                      {r.djpower.toFixed(3)}
                      {r.maxDjpower !== null && (
                        <span className="ml-1 text-sm opacity-50">/ {r.maxDjpower.toFixed(1)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <PageLoading show={loading && records.length === 0} />
      </div>
    </div>
  )
}

export default BestPage
