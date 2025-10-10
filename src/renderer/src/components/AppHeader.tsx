import React, { useEffect, useState } from 'react'
import DJMAX_LOGO from '../assets/djmax_logo.svg'
import { VscChromeClose } from 'react-icons/vsc'
import { PiArrowClockwise, PiMinus } from 'react-icons/pi'
import { LuMaximize, LuMinimize } from 'react-icons/lu'

const AppHeader: React.FC = () => {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    const unsubscribe = window.api.onWindowStateChange?.(
      (state: 'maximized' | 'minimized' | 'normal') => {
        setIsMaximized(state === 'maximized')
      }
    )
    return () => unsubscribe?.()
  }, [])

  return (
    <header className="relative flex justify-between items-center px-4 py-2 select-none drag-header bg-[var(--color-background-soft)] text-[var(--color-text)]">
      <div className="w-auto"></div>

      <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 drag-header">
        <img src={DJMAX_LOGO} alt="DJMAX Logo" className="w-5 h-5 drag-header" />
        <span className="text-sm tracking-wide drag-header">DJMAX RESPECT V</span>
      </div>

      <div className="flex items-center gap-2 z-10">
        <button
          onClick={() => window.location.reload()}
          className="p-1 rounded-sm transition-colors no-drag-header bg-[var(--ev-c-black-soft)] hover:bg-[var(--ev-c-gray-3)] text-[var(--color-text)]"
        >
          <PiArrowClockwise className="w-4 h-4" />
        </button>

        <button
          onClick={() => window.api.minimize()}
          className="p-1 rounded-sm transition-colors no-drag-header bg-[var(--ev-c-black-soft)] hover:bg-[var(--ev-c-gray-3)] text-[var(--color-text)]"
        >
          <PiMinus className="w-4 h-4" />
        </button>

        {isMaximized ? (
          <button
            onClick={() => window.api.unmaximize()}
            className="p-1 rounded-sm transition-colors no-drag-header bg-[var(--ev-c-black-soft)] hover:bg-[var(--ev-c-gray-3)] text-[var(--color-text)]"
          >
            <LuMinimize className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={() => window.api.maximize()}
            className="p-1 rounded-sm transition-colors no-drag-header bg-[var(--ev-c-black-soft)] hover:bg-[var(--ev-c-gray-3)] text-[var(--color-text)]"
          >
            <LuMaximize className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={() => window.api.close()}
          className="p-1 rounded-sm transition-colors no-drag-header bg-[var(--ev-c-black-soft)] hover:bg-[var(--ev-c-black-mute)] text-[var(--color-text)]"
        >
          <VscChromeClose className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

export default AppHeader
