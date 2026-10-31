import { Zoomies } from 'ldrs/react'
import 'ldrs/react/Zoomies.css'
import { useEffect, useState } from 'react'
import { VscChromeClose } from 'react-icons/vsc'

const LoadingPage: React.FC = () => {
  const [progress, setProgress] = useState<{ done: number; total: number }>()

  useEffect(() => window.api.onJacketProgress(setProgress), [])

  return (
    <div className="window-border w-full h-full flex flex-col items-center justify-center bg-[var(--ev-c-black)]">
      <button
        onClick={() => {
          window.api.close()
        }}
        className="absolute top-2 right-2 hover:bg-[var(--ev-c-gray-3)] p-1 rounded-sm transition-colors z-10"
      >
        <VscChromeClose className="w-4 h-4 text-[var(--ev-c-white-soft)]" />
      </button>
      <div>
        <Zoomies size="100" stroke="5" bgOpacity="0.1" speed="1.4" color="white" />
      </div>
      {progress && progress.total > 0 && (
        <div className="mt-6 flex w-56 flex-col items-center gap-2 text-sm text-(--ev-c-white-soft)">
          <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-white transition-[width]"
              style={{ width: `${(progress.done / progress.total) * 100}%` }}
            />
          </div>
          <span className="opacity-70">
            자켓 내려받는 중 {progress.done} / {progress.total}
          </span>
        </div>
      )}
    </div>
  )
}

export default LoadingPage
