import React from "react";

interface CircularGaugeProps {
  value: number; // 0 to 100
  label: string;
  sublabel?: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  glowColor?: string;
  className?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  value,
  label,
  sublabel,
  size = 140,
  strokeWidth = 8,
  color = "#00f0ff",
  glowColor = "rgba(0, 240, 255, 0.5)",
  className = ""
}) => {
  const clampedValue = Math.min(Math.max(0, value), 100);
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (clampedValue / 100) * circumference;

  return (
    <div className={`relative flex flex-col items-center justify-center ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          {/* Background track circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgba(0, 240, 255, 0.12)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Dotted decorative outer ring */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius + strokeWidth - 1}
            stroke="rgba(0, 240, 255, 0.25)"
            strokeWidth={1}
            strokeDasharray="4 6"
            fill="transparent"
          />

          {/* Value active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            style={{
              transition: "stroke-dashoffset 0.8s ease-in-out",
              filter: `drop-shadow(0 0 6px ${glowColor})`
            }}
          />
        </svg>

        {/* Center Readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-wider font-['Orbitron',sans-serif] text-[#00f0ff] drop-shadow-[0_0_8px_rgba(0,240,255,0.7)]">
            {Math.round(clampedValue)}%
          </span>
          <span className="text-[10px] uppercase tracking-widest text-[#00f0ff]/70 font-semibold mt-0.5">
            {label}
          </span>
          {sublabel && (
            <span className="text-[9px] text-white/50 tracking-tight">
              {sublabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
