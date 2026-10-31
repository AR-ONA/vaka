import React from 'react'
import { UploadHistoryEntry } from '../../../types/api'
import { PATTERN_COLORS } from '../utils/pattern'

interface UploadHistoryProps {
  entries: UploadHistoryEntry[]
  onClear: () => void
}

const STATUS: Record<UploadHistoryEntry['status'], { label: string; className: string }> = {
  updated: { label: '갱신', className: 'bg-emerald-400/15 text-emerald-300' },
  kept: { label: '유지', className: 'bg-sky-400/15 text-sky-300' },
  failed: { label: '실패', className: 'bg-red-400/15 text-red-300' }
}

const formatTime = (at: number): string =>
  new Date(at).toLocaleString('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const UploadHistory: React.FC<UploadHistoryProps> = ({ entries, onClear }) => {
  if (entries.length === 0) {
    return <p className="py-10 text-center text-base opacity-60">업로드한 기록이 없습니다</p>
  }

  return (
    <div className="flex min-h-0 flex-col gap-2">
      <div className="flex justify-end">
        <button
          onClick={onClear}
          className="rounded px-2 py-1 text-sm opacity-60 transition-colors hover:bg-(--ev-c-gray-3) hover:opacity-100"
        >
          기록 지우기
        </button>
      </div>
      <ul className="flex min-h-0 flex-col gap-1.5 overflow-auto pr-2">
        {entries.map((entry) => {
          const status = STATUS[entry.status]
          return (
            <li
              key={`${entry.at}-${entry.name}-${entry.pattern}`}
              title={entry.message}
              className="grid grid-cols-[1fr_auto] items-center gap-x-3 rounded-lg bg-(--color-background-soft) px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-base">{entry.name}</p>
                <p className="mt-0.5 flex items-center gap-2 text-xs opacity-70">
                  <span>{formatTime(entry.at)}</span>
                  <span>{entry.button}B</span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-semibold ${PATTERN_COLORS[entry.pattern]}`}
                  >
                    {entry.pattern}
                  </span>
                  <span>{entry.score.toFixed(2)}%</span>
                  {entry.maxCombo && <span className="text-teal-300">MAX COMBO</span>}
                </p>
              </div>
              <span className={`rounded px-2 py-0.5 text-xs font-semibold ${status.className}`}>
                {status.label}
              </span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default UploadHistory
