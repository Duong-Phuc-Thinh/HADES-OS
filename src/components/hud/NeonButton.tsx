import React from "react";

interface NeonButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "amber";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  loading?: boolean;
}

export const NeonButton: React.FC<NeonButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  className = "",
  disabled,
  ...props
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return "border-[#0066ff]/50 text-[#80b3ff] hover:bg-[#0066ff]/20 hover:border-[#0066ff] hover:shadow-[0_0_15px_rgba(0,102,255,0.4)]";
      case "danger":
        return "border-[#ff3344]/50 text-[#ff8088] hover:bg-[#ff3344]/20 hover:border-[#ff3344] hover:shadow-[0_0_15px_rgba(255,51,68,0.4)]";
      case "amber":
        return "border-[#ffaa00]/50 text-[#ffcc66] hover:bg-[#ffaa00]/20 hover:border-[#ffaa00] hover:shadow-[0_0_15px_rgba(255,170,0,0.4)]";
      case "primary":
      default:
        return "border-[#00f0ff]/60 text-[#00f0ff] hover:bg-[#00f0ff]/15 hover:border-[#00f0ff] hover:shadow-[0_0_18px_rgba(0,240,255,0.5)]";
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "text-[11px] px-2.5 py-1";
      case "lg":
        return "text-sm px-6 py-2.5";
      case "md":
      default:
        return "text-xs px-4 py-1.5";
    }
  };

  return (
    <button
      disabled={disabled || loading}
      className={`relative inline-flex items-center justify-center font-['Orbitron',sans-serif] font-semibold uppercase tracking-wider transition-all duration-200 border bg-[#030d1d]/80 rounded-xs cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed ${getVariantStyles()} ${getSizeStyles()} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
      ) : icon ? (
        <span className="mr-2 flex items-center">{icon}</span>
      ) : null}
      <span>{children}</span>
    </button>
  );
};
