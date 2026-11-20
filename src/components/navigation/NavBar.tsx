import React from "react";
import {
  LayoutDashboard,
  Bot,
  Mail,
  Coins,
  Code2,
  CheckSquare,
  Settings
} from "lucide-react";

export type NavTab = "home" | "agents" | "gmail" | "finance" | "coding" | "productivity" | "settings";

interface NavBarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ activeTab, onTabChange }) => {
  const navItems: { id: NavTab; label: string; icon: React.ReactNode }[] = [
    { id: "home", label: "TỔNG QUAN", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "agents", label: "TÁC NHÂN", icon: <Bot className="w-4 h-4" /> },
    { id: "gmail", label: "GMAIL", icon: <Mail className="w-4 h-4" /> },
    { id: "finance", label: "TÀI CHÍNH", icon: <Coins className="w-4 h-4" /> },
    { id: "coding", label: "LẬP TRÌNH", icon: <Code2 className="w-4 h-4" /> },
    { id: "productivity", label: "NĂNG SUẤT", icon: <CheckSquare className="w-4 h-4" /> },
    { id: "settings", label: "CÀI ĐẶT", icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <nav className="h-12 bg-[#030d1d]/90 border-b border-[#00f0ff]/25 px-4 flex items-center justify-between backdrop-blur-md z-40">
      <div className="flex items-center space-x-1 sm:space-x-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`relative flex items-center space-x-2 px-3 py-1.5 rounded-xs transition-all duration-200 font-['Orbitron',sans-serif] text-xs font-semibold tracking-wider cursor-pointer ${
                isActive
                  ? "text-[#00f0ff] bg-[#00f0ff]/15 border-b-2 border-[#00f0ff] shadow-[0_0_12px_rgba(0,240,255,0.4)]"
                  : "text-white/60 hover:text-[#00f0ff] hover:bg-[#00f0ff]/5"
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden md:inline">{item.label}</span>

              {/* Top tiny active marker */}
              {isActive && (
                <div className="absolute -top-[1px] left-1/2 transform -translate-x-1/2 w-3 h-[2px] bg-[#00f0ff] shadow-[0_0_6px_#00f0ff]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Right HUD System Tag */}
      <div className="hidden lg:flex items-center space-x-2 text-[10px] uppercase font-bold tracking-widest text-[#00f0ff]/60 border border-[#00f0ff]/20 px-2.5 py-1 rounded bg-[#020813]/80">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
        <span>HADES SECURE OS PROTOCOL</span>
      </div>
    </nav>
  );
};
