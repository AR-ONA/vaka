import { useEffect, useState } from "react";
import { useQueries } from "@tanstack/react-query";
import { fetchBoards, fetchSongData, fetchTiers } from "./api/api";
import "./App.css";
import AppHeader from "./components/Header";
import Menu from "./components/Menu";
import LoadingPage from "./pages/LoadingPage";
import UploadPage from "./pages/UploadPage";
import { invoke } from "@tauri-apps/api/core";

function App() {
	const results = useQueries({
		queries: [
			{ queryKey: ["songs"], queryFn: fetchSongData },
			{ queryKey: ["boards"], queryFn: fetchBoards },
			{ queryKey: ["tiers"], queryFn: fetchTiers },
		],
	});

	const isDataLoading = results.some((result) => result.isLoading);
	const songData: SongData = results[0].data;
	const [isLoaderMounted, setIsLoaderMounted] = useState(true);

	const [selectedPage, setSelectedPage] = useState<string>("업로드");

	useEffect(() => {
		if (!isDataLoading) {
			const timer = setTimeout(() => {
				setIsLoaderMounted(false);
				console.log(songData)
				invoke('init_songs', { songs: songData })
			}, 500);

			return () => clearTimeout(timer);
		}
	}, [isDataLoading]);

	return (
		<>
			<div className="window-border w-full h-full flex flex-col overflow-hidden">
				<AppHeader />
				<div className="flex flex-1 overflow-hidden pr-2 pb-2">
					<Menu setSelectedPage={setSelectedPage}/>
					<main className="flex-1 bg-white overflow-auto rounded-xl">
						<UploadPage />
						<div className="p-4">
							<p className="mb-4">{JSON.stringify(songData)}</p>
						</div>
					</main>
				</div>
			</div>

			{isLoaderMounted && (
				<div
					className={`
						absolute inset-0 z-50 
						transition-opacity duration-500 ease-in-out
						${isDataLoading ? "opacity-100" : "opacity-0"}
					`}
				>
					<LoadingPage />
				</div>
			)}
		</>
	);
}

export default App;