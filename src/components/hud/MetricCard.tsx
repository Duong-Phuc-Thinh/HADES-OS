import React from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: React.ReactNode;
  percent?: number;
  className?: string;
  status?: "normal" | "warning" | "danger";
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  subtext,
  icon,
  percent,
  className = "",
  status = "normal"
}) => {
  const getStatusColor = () => {
    switch (status) {
      case "danger":
        return { text: "text-[#ff3344]", bar: "bg-[#ff3344]", glow: "shadow-[0_0_8px_#ff3344]" };
      case "warning":
        return { text: "text-[#ffaa00]", bar: "bg-[#ffaa00]", glow: "shadow-[0_0_8px_#ffaa00]" };
      case "normal":
      default:
        return { text: "text-[#00f0ff]", bar: "bg-[#00f0ff]", glow: "shadow-[0_0_8px_#00f0ff]" };
    }
  };

  const colors = getStatusColor();

  return (
    <div className={`bg-[#051428]/70 border border-[#00f0ff]/20 rounded p-3 relative flex flex-col justify-between ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] uppercase font-bold tracking-widest text-[#00f0ff]/60 font-['Orbitron',sans-serif]">
          {label}
        </span>
        {icon && <div className="text-[#00f0ff]/80 text-sm">{icon}</div>}
      </div>

      <div className="flex items-baseline space-x-1 my-1">
        <span className={`text-xl font-bold font-['Orbitron',sans-serif] ${colors.text}`}>
          {value}
        </span>
        {unit && <span className="text-xs text-white/50">{unit}</span>}
      </div>

      {percent !== undefined && (
        <div className="w-full bg-[#020813] h-1.5 rounded-full overflow-hidden border border-[#00f0ff]/20 mt-1">
          <div
            className={`h-full ${colors.bar} ${colors.glow} transition-all duration-500`}
            style={{ width: `${Math.min(Math.max(0, percent), 100)}%` }}
          />
        </div>
      )}

      {subtext && (
        <span className="text-[9px] text-[#00f0ff]/50 mt-1 truncate">
          {subtext}
        </span>
      )}
    </div>
  );
};
