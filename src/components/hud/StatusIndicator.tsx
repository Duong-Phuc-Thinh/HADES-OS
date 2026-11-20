import React from "react";

interface StatusIndicatorProps {
  status: "online" | "working" | "warning" | "error" | "offline";
  label: string;
  subtext?: string;
  className?: string;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  label,
  subtext,
  className = ""
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "online":
        return {
          dot: "bg-[#00ff88]",
          glow: "shadow-[0_0_8px_#00ff88]",
          text: "text-[#00ff88]"
        };
      case "working":
        return {
          dot: "bg-[#00f0ff] animate-ping",
          glow: "shadow-[0_0_10px_#00f0ff]",
          text: "text-[#00f0ff]"
        };
      case "warning":
        return {
          dot: "bg-[#ffaa00]",
          glow: "shadow-[0_0_8px_#ffaa00]",
          text: "text-[#ffaa00]"
        };
      case "error":
        return {
          dot: "bg-[#ff3344] animate-pulse",
          glow: "shadow-[0_0_10px_#ff3344]",
          text: "text-[#ff3344]"
        };
      case "offline":
      default:
        return {
          dot: "bg-slate-500",
          glow: "shadow-none",
          text: "text-slate-400"
        };
    }
  };

  const colors = getStatusColor();

  return (
    <div className={`inline-flex items-center space-x-2 bg-[#020813]/60 px-2.5 py-1 rounded border border-[#00f0ff]/20 ${className}`}>
      <div className="relative flex items-center justify-center">
        <span className={`w-2 h-2 rounded-full ${colors.dot} ${colors.glow}`} />
      </div>
      <div className="flex flex-col">
        <span className={`text-[11px] font-bold tracking-wider uppercase font-['Orbitron',sans-serif] ${colors.text}`}>
          {label}
        </span>
        {subtext && (
          <span className="text-[9px] text-[#00f0ff]/60 tracking-tight leading-none">
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};
