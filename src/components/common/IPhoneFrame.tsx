import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Maximize2, Minimize2 } from 'lucide-react';

interface IPhoneFrameProps {
  children: React.ReactNode;
  activeCallStatus?: string;
  isRecording?: boolean;
}

export const IPhoneFrame: React.FC<IPhoneFrameProps> = ({
  children,
  activeCallStatus,
  isRecording = false
}) => {
  const [currentTime, setCurrentTime] = useState('09:41');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  if (isFullscreen) {
    return (
      <div className="relative w-full h-full bg-slate-950 text-slate-100 flex flex-col overflow-hidden">
        {/* Fullscreen header control */}
        <div className="absolute top-3 right-4 z-50 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/50 shadow-lg">
          <span className="text-xs text-slate-300 font-medium">전체화면 모드</span>
          <button
            onClick={() => setIsFullscreen(false)}
            className="p-1 rounded-full hover:bg-slate-800 text-slate-300 hover:text-white transition"
            title="iPhone 프레임으로 복귀"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 w-full h-full overflow-y-auto">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-1 sm:p-3 w-full h-full max-h-full overflow-hidden">
      {/* Device frame container */}
      <div className="relative w-full max-w-[400px] h-full max-h-[820px] bg-slate-950 rounded-[44px] shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_0_10px_#1e293b] border-4 border-slate-900 overflow-hidden flex flex-col select-none ring-1 ring-slate-800">
        
        {/* Toggle frame button */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-2.5 right-4 z-40 p-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition backdrop-blur-md border border-slate-700/40"
          title="전체화면 전환"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Dynamic Island & Status Bar */}
        <div className="relative w-full pt-3 px-7 flex items-center justify-between text-white text-[13px] font-semibold tracking-tight z-30 select-none">
          {/* Left Time */}
          <span className="w-12 text-center pl-1 font-medium text-slate-200">{currentTime}</span>

          {/* Dynamic Island */}
          <div className="absolute left-1/2 -translate-x-1/2 top-2 h-[30px] px-3.5 bg-black rounded-full flex items-center gap-2.5 shadow-md border border-slate-900/60 transition-all duration-300">
            {/* Camera lens & sensors */}
            <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center">
              <div className="w-1 h-1 rounded-full bg-blue-950/80" />
            </div>

            {/* Dynamic island status indicator */}
            {activeCallStatus ? (
              <div className="flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-[10px] text-red-400 font-bold uppercase tracking-wider">SOS 활성</span>
              </div>
            ) : isRecording ? (
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
                <span className="text-[10px] text-orange-300 font-medium">녹음 중</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-blue-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                <span>BlueCall</span>
              </div>
            )}

            <div className="w-2 h-2 rounded-full bg-slate-900 border border-slate-800" />
          </div>

          {/* Right Status Icons */}
          <div className="flex items-center gap-1.5 text-slate-300 pr-4">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <div className="flex items-center">
              <span className="text-[11px] mr-0.5 text-slate-300">98%</span>
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Screen Content */}
        <div className="flex-1 w-full overflow-y-auto overflow-x-hidden relative flex flex-col bg-slate-950 text-slate-100">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="w-full h-5 flex items-center justify-center bg-slate-950 z-30 pointer-events-none">
          <div className="w-36 h-1 bg-slate-500/60 rounded-full" />
        </div>
      </div>
    </div>
  );
};
