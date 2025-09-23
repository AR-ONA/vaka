import React, { useEffect, useRef, useState } from "react";
import DJMAX_LOGO from "../assets/djmax_logo.svg";
import { VscChromeClose } from "react-icons/vsc";
import { getCurrentWindow, Window } from "@tauri-apps/api/window";
import { PiArrowClockwise, PiMinus } from "react-icons/pi";
import { LuMaximize, LuMinimize } from "react-icons/lu";

const AppHeader: React.FC = () => {
    const windowRef = useRef<Window | null>(null);
    const [isMaximized, setIsMaximized] = useState(false);

    useEffect(() => {
        const initWindow = async () => {
            const window = await getCurrentWindow();
            windowRef.current = window;

            const unlisten = window.onResized(async () => {
                const maximized = await window.isMaximized();
                setIsMaximized(maximized);
            });
            
            const maximized = await window.isMaximized();
            setIsMaximized(maximized);

            await window.listen('tauri://resize', async () => {
                const maximized = await window.isMaximized();
                setIsMaximized(maximized);
            });

            window.isMaximized().then(setIsMaximized);

            return () => {
                unlisten.then(f => f());
            };
        };

        initWindow();
    }, []);

    return (
        <header data-tauri-drag-region className="relative flex justify-between items-center px-4 py-2 select-none bg-[#F4F7FF]">
            <div className="w-auto"></div> 

            <div 
                data-tauri-drag-region 
                className="absolute left-1/2 -translate-x-1/2 flex justify-center items-center gap-2"
            >
                <img data-tauri-drag-region
                    src={DJMAX_LOGO} 
                    alt="DJMAX Logo" 
                    className="w-5 h-5"
                />
                <span data-tauri-drag-region className="text-gray-600 text-sm tracking-wide">
                    DJMAX RESPECT V
                </span>
            </div>

            <div className="flex items-center gap-2 z-10">
                <button onClick={() => window.location.reload()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                    <PiArrowClockwise className="w-4 h-4 text-gray-600"  />
                </button>
                <button onClick={() => windowRef.current?.minimize()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                    <PiMinus className="w-4 h-4 text-gray-600" />
                </button>
                { isMaximized ? (
                    <button onClick={() => windowRef.current?.unmaximize()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors ease-in-out">
                        <LuMinimize className="w-4 h-4 text-gray-600" />
                    </button>
                ) : (
                    <button onClick={() => windowRef.current?.maximize()} className="hover:bg-gray-200 p-1 rounded-sm transition-colors">
                        <LuMaximize className="w-4 h-4 text-gray-600" />
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