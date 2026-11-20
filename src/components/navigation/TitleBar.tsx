import React, { useEffect, useState } from "react";
import { Minus, Square, X, Cpu, Wifi } from "lucide-react";
import { useSystemStore } from "../../store/useSystemStore";

export const TitleBar: React.FC = () => {
  const { currentTime, updateCurrentTime, isOnline } = useSystemStore();

  useEffect(() => {
    const timer = setInterval(() => {
      updateCurrentTime();
    }, 1000);
    return () => clearInterval(timer);
  }, [updateCurrentTime]);

  const handleMinimize = () => window.hadesApi?.minimizeWindow();
  const handleMaximize = () => window.hadesApi?.maximizeWindow();
  const handleClose = () => window.hadesApi?.closeWindow();

  // Format real Windows time
  const timeStr = currentTime.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });

  const dateStr = currentTime.toLocaleDateString("vi-VN", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  return (
    <header className="h-9 bg-[#020813] border-b border-[#00f0ff]/20 flex items-center justify-between px-3 select-none z-50 app-drag-region">
      {/* Left: App Title and Live Indicator */}
      <div className="flex items-center space-x-3 no-drag">
        <div className="flex items-center space-x-1.5">
          <div className="w-2.5 h-2.5 bg-[#00f0ff] rounded-xs shadow-[0_0_8px_#00f0ff] rotate-45" />
          <span className="text-xs font-black tracking-[0.25em] font-['Orbitron',sans-serif] text-[#00f0ff]">
            HADES OS
          </span>
          <span className="text-[10px] text-white/40 tracking-wider">v1.0.0</span>
        </div>

        <div className="h-3 w-[1px] bg-[#00f0ff]/30 mx-1" />

        {/* Online & Hardware status beacon */}
        <div className="flex items-center space-x-2 text-[10px] tracking-wider text-[#00f0ff]/70 font-semibold">
          <div className="flex items-center space-x-1">
            <Wifi className={`w-3 h-3 ${isOnline ? "text-[#00ff88]" : "text-[#ff3344]"}`} />
            <span className="hidden sm:inline">{isOnline ? "KẾT NỐI" : "NGOẠI TUYẾN"}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-[#00f0ff]" />
            <span className="hidden sm:inline">WINDOWS 11</span>
          </div>
        </div>
      </div>

      {/* Center: Live Windows System Clock */}
      <div className="flex items-center space-x-2 text-xs font-['Orbitron',sans-serif] tracking-widest text-[#00f0ff] drop-shadow-[0_0_6px_rgba(0,240,255,0.6)]">
        <span className="font-bold">{timeStr}</span>
        <span className="text-[10px] text-[#00f0ff]/50 font-normal">{dateStr}</span>
      </div>

      {/* Right: Window Controls */}
      <div className="flex items-center space-x-1 no-drag">
        <button
          onClick={handleMinimize}
          className="w-7 h-6 flex items-center justify-center text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-xs transition-colors"
          title="Thu nhỏ"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-7 h-6 flex items-center justify-center text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/10 rounded-xs transition-colors"
          title="Phóng to"
        >
          <Square className="w-3 h-3" />
        </button>
        <button
          onClick={handleClose}
          className="w-7 h-6 flex items-center justify-center text-white/60 hover:text-[#ff3344] hover:bg-[#ff3344]/20 rounded-xs transition-colors"
          title="Đóng ứng dụng"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
