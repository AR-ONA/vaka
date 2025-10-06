import React from 'react'
import LoadingPage from './Pages/loading'
import { useInitialDataLoader } from './hooks/useInitialDataLoader'

export const App: React.FC = () => {
  const { isLoading, isPageMounted } = useInitialDataLoader()

  return (
    <>
      <div className="window-border w-full h-full flex flex-col overflow-hidden font-inter">
        <div className="flex flex-1 overflow-hidden pr-2 pb-2">
          <h1>Hello World!</h1>
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
