import React, { useEffect, useState } from 'react'
import LoadingPage from './Pages/loading'
import { useInitialDataLoader } from './hooks/useInitialDataLoader'
import AppHeader from './components/AppHeader'
import AppMenu from './components/AppMenu'
import BestPage from './Pages/best'
import ConstantsPage from './Pages/constants'
import ProfilePage from './Pages/profile'
import SettingsPage from './Pages/settings'
import SummaryPage from './Pages/summary'
import UploadPage from './Pages/upload'
import { usePendingShot } from './store/usePendingShot'

export const App: React.FC = () => {
  const { isLoading, isPageMounted } = useInitialDataLoader()
  const [selectedPage, setSelectedPage] = useState('업로드')
  const setShot = usePendingShot((state) => state.setShot)

  // 감시 폴더에 새 결과창 스크린샷이 생기면 업로드 화면에서 인식한다
  useEffect(
    () =>
      window.api.onScreenshot((shot) => {
        setShot(shot)
        setSelectedPage('업로드')
      }),
    [setShot]
  )

  return (
    <>
      <div className="window-border w-full h-full flex flex-col overflow-hidden font-inter">
        <AppHeader />
        <div className="flex flex-1 overflow-hidden pr-2 pb-2">
          <AppMenu setSelectedPage={setSelectedPage} />
          <main className="flex-1 bg-[var(--color-background)] overflow-auto rounded-xl">
            {selectedPage === '업로드' ? (
              <UploadPage />
            ) : selectedPage === '베스트' ? (
              <SummaryPage />
            ) : selectedPage === '성과표' ? (
              <BestPage />
            ) : selectedPage === '상수표' ? (
              <ConstantsPage />
            ) : selectedPage === '프로필' ? (
              <ProfilePage />
            ) : selectedPage === '설정' ? (
              <SettingsPage />
            ) : (
              <div className="p-4">
                <p className="mb-4">Hello World!</p>
              </div>
            )}
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
