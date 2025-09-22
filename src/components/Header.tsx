import React, { useEffect, useRef, useState } from "react";
import DJMAX_LOGO from "../assets/djmax_logo.svg";
import { VscChromeClose, VscChromeMaximize, VscChromeMinimize, VscChromeRestore } from "react-icons/vsc";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";

const AppHeader: React.FC = () => {
    const windowRef = useRef<Window | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const initWindow = async () => {
            const window = await getCurrentWindow();
            windowRef.current = window;
            
            const maximized = await window.isMaximized();
            setIsMaximized(maximized);

            await window.listen('tauri://resize', async () => {
                const maximized = await window.isMaximized();
                setIsMaximized(maximized);
            });
        };

        initWindow();
    }, []);

    return (
        <header data-tauri-drag-region className="flex justify-center items-center px-4 py-2 select-none gap-2 bg-[#F4F7FF]">
            <div data-tauri-drag-region className="w-12"></div>
            <div data-tauri-drag-region className="flex-1 flex justify-center items-center gap-2">
                <img data-tauri-drag-region
                    src={DJMAX_LOGO} 
                    alt="DJMAX Logo" 
                    className="w-5 h-5"
                />
                <span data-tauri-drag-region className="text-gray-600 text-sm tracking-wide">
                    DJMAX RESPECT V
                </span>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => windowRef.current?.minimize()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                    <VscChromeMinimize className="w-4 h-4 text-gray-600" />
                </button>
                { isMaximized ? (
                    <button onClick={() => windowRef.current?.unmaximize()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                        <VscChromeRestore className="w-4 h-4 text-gray-600" />
                    </button>
                ) : (
                    <button onClick={() => windowRef.current?.maximize()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                        <VscChromeMaximize className="w-4 h-4 text-gray-600" />
                    </button>
                )}
                <button onClick={() => windowRef.current?.close()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                    <VscChromeClose className="w-4 h-4 text-gray-600" />
                </button>
            </div>
        </header>
    );
};

export default AppHeader;