import React, { useState } from 'react'
import LoadingPage from './Pages/loading'
import { useInitialDataLoader } from './hooks/useInitialDataLoader'
import AppHeader from './components/AppHeader'
import AppMenu from './components/AppMenu'

export const App: React.FC = () => {
  const { isLoading, isPageMounted } = useInitialDataLoader()
  const [selectedPage, setSelectedPage] = useState('test!')

  return (
    <>
      <div className="window-border w-full h-full flex flex-col overflow-hidden font-inter">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden pr-2 pb-2">
          <AppMenu setSelectedPage={setSelectedPage} />
          <main className="flex-1 bg-[var(--color-background)] overflow-auto rounded-xl">
            <div className="p-4">
              <p className="mb-4">Hello World!</p>
            </div>
          </main>
        </div>
      </div>

      {isPageMounted && (
        <div
          className={`absolute inset-0 z-50 transition-opacity duration-500 ease-in-out ${
            isLoading ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <LoadingPage />
        </div>
      )}
    </>
  )
}
