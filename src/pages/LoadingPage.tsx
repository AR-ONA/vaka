import { getCurrentWindow, Window } from '@tauri-apps/api/window';
import { Zoomies } from 'ldrs/react'
import 'ldrs/react/Zoomies.css'
import { useEffect, useRef } from 'react';
import { VscChromeClose } from 'react-icons/vsc';


const LoadingPage: React.FC = () => {
	const windowRef = useRef<Window | null>(null);

	useEffect(() => {
		const initWindow = async () => {
			const window = await getCurrentWindow();
        	windowRef.current = window;
		}
		initWindow();
	}, []);


	return (
		<div data-tauri-drag-region className="window-border w-full h-full flex flex-col items-center justify-center">
			<button
				onClick={() => windowRef.current?.close()}
				className="absolute top-2 right-2 hover:bg-gray-200 p-1 rounded-sm transition-colors z-10"
			>
				<VscChromeClose className="w-4 h-4 text-gray-600" />
			</button>
			<div>
				<Zoomies
					size="100"
					stroke="5"
					bgOpacity="0.1"
					speed="1.4"
					color="black"
				/>
			</div>
		</div>
	);
};

export default LoadingPage;