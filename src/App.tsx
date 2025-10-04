import { useEffect, useState } from "react";
// import AppHeader from "./components/Header";
// import Menu from "./components/Menu";
// import LoadingPage from "./pages/LoadingPage";
// import UploadPage from "./pages/UploadPage";
import "./App.css";
import LoadingPage from "./Pages/LoadingPage";
import type { SongData } from "./types";

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isPageMounted, setIsPageMounted] = useState(true); 

  const [selectedPage, setSelectedPage] = useState<string>("업로드");

  const [songs, setSongs] = useState<SongData | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fetchedSongs, boards, tiers]: [SongData, any, any] = await Promise.all([
          window.electronAPI.fetchSongs(),
          window.electronAPI.fetchBoards(),
          window.electronAPI.fetchTiers(),
        ]);
        setSongs(fetchedSongs);
      } catch (err) {
        console.error("데이터 fetch 실패:", err);
      } finally {
        setTimeout(() => setIsLoading(false), 100);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        setIsPageMounted(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <>
      <div className="window-border w-full h-full flex flex-col overflow-hidden">
        {/* <AppHeader />
        <div className="flex flex-1 overflow-hidden pr-2 pb-2">
          <Menu setSelectedPage={setSelectedPage} />
          <main className="flex-1 bg-white overflow-auto rounded-xl">
            {selectedPage === "업로드" && <UploadPage />}
          </main>
        </div> */}
        <h1>{JSON.stringify(songs)}</h1>
      </div>

      {isPageMounted && (
        <div
          className={`absolute inset-0 z-50 transition-opacity duration-500 ease-in-out ${
            isLoading ? "opacity-100" : "opacity-0"
          }`}
        >
          <LoadingPage />
        </div>
      )}
    </>
  );
}

export default App;
