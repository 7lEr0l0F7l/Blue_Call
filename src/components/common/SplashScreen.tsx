import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onFinish?: () => void;
  duration?: number; // ms
  allowSkip?: boolean;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  duration = 2000,
  allowSkip = true
}) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const p = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(p);

      if (elapsed >= duration) {
        clearInterval(interval);
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          if (onFinish) onFinish();
        }, 400); // 400ms fade transition
      }
    }, 40);

    return () => clearInterval(interval);
  }, [duration, onFinish]);

  const handleSkip = () => {
    if (!allowSkip) return;
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      if (onFinish) onFinish();
    }, 200);
  };

  if (!visible) return null;

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#040d21] select-none cursor-pointer transition-opacity duration-400 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      title="터치하여 건너뛰기"
    >
      {/* Background Splash Image */}
      <div className="absolute inset-0 w-full h-full flex items-center justify-center overflow-hidden">
        <img
          src="/splash-screen.png"
          alt="BlueCall Splash Screen"
          className="w-full h-full object-cover sm:object-contain select-none pointer-events-none"
        />
        {/* Subtle vignette gradient for smooth blending */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020817] via-transparent to-transparent opacity-60" />
      </div>

      {/* Top status filler (empty spacer) */}
      <div className="relative z-10 pt-4" />

      {/* Bottom Loading Progress & Network Status Indicator */}
      <div className="relative z-10 w-full max-w-xs px-6 pb-8 flex flex-col items-center gap-2.5">
        {/* Progress Bar */}
        <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden backdrop-blur-sm border border-cyan-500/30">
          <div
            className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full transition-all duration-75 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Status text */}
        <div className="flex items-center justify-between w-full text-[10px] text-cyan-200/80 font-mono tracking-tight">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
            <span>해상 안전 네트워크 초기화 중...</span>
          </span>
          <span className="font-bold text-cyan-400">{progress}%</span>
        </div>

        <p className="text-[9px] text-slate-400/80 mt-1">화면을 터치하면 바로 시작합니다</p>
      </div>
    </div>
  );
};
