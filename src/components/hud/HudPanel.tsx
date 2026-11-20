import React from "react";

interface HudPanelProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  cornerBrackets?: boolean;
  action?: React.ReactNode;
}

export const HudPanel: React.FC<HudPanelProps> = ({
  title,
  subtitle,
  children,
  className = "",
  glow = false,
  cornerBrackets = true,
  action
}) => {
  return (
    <div
      className={`relative bg-[#051428]/80 backdrop-blur-md border border-[#00f0ff]/25 rounded-sm p-4 transition-all duration-300 ${
        glow ? "box-glow-cyan" : ""
      } ${cornerBrackets ? "hud-corner-brackets" : ""} ${className}`}
    >
      {/* Top Header if Title exists */}
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2 mb-3">
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-3.5 bg-[#00f0ff] rounded-xs shadow-[0_0_8px_#00f0ff]" />
            <div>
              {title && (
                <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-[#00f0ff] font-['Orbitron',sans-serif]">
                  {title}
                </h3>
              )}
              {subtitle && (
                <span className="text-[10px] uppercase tracking-wider text-[#00f0ff]/50">
                  {subtitle}
                </span>
              )}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">{children}</div>

      {/* Subtle grid background texture */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(0,240,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none rounded-sm" />
    </div>
  );
};
