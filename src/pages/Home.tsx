import React, { useEffect, useRef } from "react";
import { Cpu, HardDrive, Layers, Bell, CheckSquare, CloudSun, ShieldCheck, Trash2, Bot, AlertTriangle, Sparkles } from "lucide-react";
import { useSystemStore } from "../store/useSystemStore";
import { useChatStore } from "../store/useChatStore";
import { useAgentStore } from "../store/useAgentStore";
import { HadesAvatarCanvas } from "../components/avatar3d/HadesAvatarCanvas";
import { CircularGauge } from "../components/hud/CircularGauge";
import { HudPanel } from "../components/hud/HudPanel";
import { CommandBar } from "../components/hud/CommandBar";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { ChatMessage } from "../types";

export const Home: React.FC = () => {
  const { metrics, fetchMetrics } = useSystemStore();
  const { messages, isSending, error, loadConversations, clearActiveConversation } = useChatStore();
  const { robotState } = useAgentStore();
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMetrics();
    loadConversations();
    const interval = setInterval(fetchMetrics, 3000);
    return () => clearInterval(interval);
  }, [fetchMetrics, loadConversations]);

  // Auto-scroll chat log to bottom when messages update
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const getAgentColor = (agentName?: string, role?: string) => {
    if (role === "user") return "text-[#00ff88] border-[#00ff88]/30 bg-[#00ff88]/10";
    if (!agentName) return "text-[#00f0ff] border-[#00f0ff]/30 bg-[#00f0ff]/10";
    if (agentName.includes("Coding")) return "text-[#00ffaa] border-[#00ffaa]/30 bg-[#00ffaa]/10";
    if (agentName.includes("Finance")) return "text-[#00e5ff] border-[#00e5ff]/30 bg-[#00e5ff]/10";
    if (agentName.includes("System")) return "text-[#c084fc] border-[#c084fc]/30 bg-[#c084fc]/10";
    if (agentName.includes("Gmail")) return "text-[#f87171] border-[#f87171]/30 bg-[#f87171]/10";
    if (agentName.includes("Productivity")) return "text-[#fbbf24] border-[#fbbf24]/30 bg-[#fbbf24]/10";
    return "text-[#00f0ff] border-[#00f0ff]/30 bg-[#00f0ff]/10";
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Quick Status Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 pb-2">
        <div className="flex items-center space-x-3">
          <StatusIndicator status="online" label="HỆ THỐNG SẴN SÀNG" subtext="HADES CORE ACTIVE" />
          <div className="flex items-center space-x-1.5 text-xs text-[#00f0ff]/70 font-semibold bg-[#030d1d] px-2.5 py-1 rounded border border-[#00f0ff]/20">
            <ShieldCheck className="w-3.5 h-3.5 text-[#00ff88]" />
            <span>LOCAL-FIRST ENCRYPTED</span>
          </div>
          <div className="hidden sm:flex items-center space-x-1.5 text-xs text-white/50 bg-[#030d1d] px-2.5 py-1 rounded border border-[#00f0ff]/20">
            <Bot className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span className="font-mono text-[11px] text-[#00f0ff]">ROBOT STATE: {robotState}</span>
          </div>
        </div>

        {/* Configured Weather preview (Hà Nội, Việt Nam default location) */}
        <div className="flex items-center space-x-2 bg-[#030d1d] px-3 py-1 rounded border border-[#00f0ff]/20 text-xs">
          <CloudSun className="w-4 h-4 text-[#ffaa00]" />
          <span className="text-[#00f0ff] font-bold">Hà Nội: 28°C</span>
          <span className="text-white/40">| Có mây, độ ẩm 65%</span>
        </div>
      </div>

      {/* Main Grid Layout: Left Gauges, Center 3D Robot HUD, Right Tasks & Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Real Hardware Statistics */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          <HudPanel title="GIÁM SÁT PHẦN CỨNG" subtitle="WINDOWS TELEMETRY">
            <div className="space-y-4 py-2">
              <CircularGauge
                value={metrics?.cpu_percent ?? 0}
                label="CPU LOAD"
                sublabel={`${metrics?.cpu_percent ?? 0}%`}
                size={120}
                strokeWidth={7}
                color="#00f0ff"
              />

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#00f0ff]/15">
                <div className="bg-[#020813]/60 p-2 rounded border border-[#00f0ff]/20 text-center">
                  <div className="flex items-center justify-center space-x-1 text-[#00f0ff] text-xs mb-1">
                    <Layers className="w-3 h-3" />
                    <span className="font-bold">RAM</span>
                  </div>
                  <span className="text-lg font-bold font-['Orbitron',sans-serif] text-white">
                    {metrics?.memory_percent ?? 0}%
                  </span>
                  <div className="text-[9px] text-[#00f0ff]/50">
                    {metrics ? `${Math.round(metrics.memory_used_mb / 1024)}GB / ${Math.round(metrics.memory_total_mb / 1024)}GB` : "---"}
                  </div>
                </div>

                <div className="bg-[#020813]/60 p-2 rounded border border-[#00f0ff]/20 text-center">
                  <div className="flex items-center justify-center space-x-1 text-[#00f0ff] text-xs mb-1">
                    <HardDrive className="w-3 h-3" />
                    <span className="font-bold">Ổ C:</span>
                  </div>
                  <span className="text-lg font-bold font-['Orbitron',sans-serif] text-white">
                    {metrics?.disk_percent ?? 0}%
                  </span>
                  <div className="text-[9px] text-[#00f0ff]/50">
                    {metrics ? `Trống ${metrics.disk_free_gb} GB` : "---"}
                  </div>
                </div>
              </div>

              {/* GPU Spec */}
              <div className="bg-[#020813]/70 p-2 rounded border border-[#00f0ff]/20 text-xs">
                <div className="text-[#00f0ff]/60 uppercase text-[9px] font-bold">CARD ĐỒ HỌA (GPU)</div>
                <div className="font-semibold text-white truncate mt-0.5">
                  {metrics?.gpu_name || "Không hỗ trợ"}
                </div>
              </div>
            </div>
          </HudPanel>
        </div>

        {/* Center Column: 3D Holographic HADES Avatar & Real-time Cyber Chat Log */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          <HudPanel className="w-full h-full flex flex-col justify-between" glow>
            <div className="text-center pt-1 pb-1">
              <span className="text-[10px] tracking-[0.3em] font-bold text-[#00f0ff]/70 uppercase font-['Orbitron',sans-serif]">
                • TÂM ĐIỂM CHỈ HUY TRÍ TUỆ NHÂN TẠO •
              </span>
            </div>

            {/* 3D AVATAR CANVAS */}
            <HadesAvatarCanvas />

            {/* Real-time Cyber HUD Chat Log */}
            <div className="mt-2 bg-[#020813]/90 border border-[#00f0ff]/30 rounded-lg p-3 flex flex-col flex-1 max-h-[220px] shadow-[inset_0_0_15px_rgba(0,240,255,0.08)]">
              {/* Header with Title and Clear Action */}
              <div className="text-[9px] uppercase font-bold text-[#00f0ff]/80 pb-2 mb-2 border-b border-[#00f0ff]/20 flex items-center justify-between font-['Orbitron',sans-serif]">
                <div className="flex items-center space-x-1.5">
                  <Sparkles className="w-3 h-3 text-[#00f0ff] animate-pulse" />
                  <span>NHẬT KÝ ĐÀM THOẠI HADES CORE</span>
                  <span className="text-[8px] text-white/40">({messages.length} tin nhắn)</span>
                </div>
                {messages.length > 0 && (
                  <button
                    type="button"
                    onClick={clearActiveConversation}
                    title="Xóa phiên hội thoại hiện tại"
                    className="text-white/40 hover:text-[#ff8088] transition-colors p-0.5 cursor-pointer flex items-center space-x-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="text-[8px] uppercase">Làm mới</span>
                  </button>
                )}
              </div>

              {/* Error Alert Box */}
              {error && (
                <div className="mb-2 p-2 rounded bg-[#ff3344]/15 border border-[#ff3344]/40 flex items-start space-x-2 text-xs text-[#ff8088]">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-[#ff3344] mt-0.5" />
                  <div className="flex-1 text-[11px] leading-relaxed">
                    <span className="font-bold">LỖI HỆ THỐNG: </span>
                    {error}
                  </div>
                </div>
              )}

              {/* Scrollable Message List */}
              <div
                ref={chatScrollRef}
                className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin scrollbar-thumb-[#00f0ff]/30"
              >
                {messages.length === 0 ? (
                  <div className="text-xs text-white/40 italic text-center py-6 flex flex-col items-center justify-center space-y-1">
                    <Bot className="w-6 h-6 text-[#00f0ff]/30 mb-1" />
                    <span>Hệ thống HADES OS đã sẵn sàng tiếp nhận mệnh lệnh.</span>
                    <span className="text-[10px] text-white/30">
                      Gợi ý: "Kiểm tra CPU máy tính", "Hôm nay tôi đã tiêu bao nhiêu tiền?", "Kiểm tra git"
                    </span>
                  </div>
                ) : (
                  messages.map((m: ChatMessage) => {
                    const isUser = m.role === "user";
                    const badgeClass = getAgentColor(m.agent_name, m.role);

                    return (
                      <div
                        key={m.id}
                        className={`p-2 rounded border text-xs transition-all ${
                          isUser
                            ? "bg-[#031526]/70 border-[#00f0ff]/30 ml-4"
                            : "bg-[#020c1a]/80 border-[#00f0ff]/20 mr-2"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border font-['Orbitron',sans-serif] ${badgeClass}`}
                          >
                            {isUser ? "BẠN" : m.agent_name || "HADES CORE"}
                          </span>
                          <span className="text-[9px] text-white/30 font-mono">
                            {new Date(m.created_at).toLocaleTimeString("vi-VN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </span>
                        </div>

                        {/* Message Content with Line Breaks and Cyber Terminal styling */}
                        {m.content ? (
                          <div className="text-white/90 text-[11px] leading-relaxed whitespace-pre-wrap font-sans">
                            {m.content}
                          </div>
                        ) : isSending ? (
                          <div className="flex items-center space-x-1.5 text-[11px] text-[#00f0ff]/70 py-1 animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
                            <span>Đang phân tích và xử lý phản hồi...</span>
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </HudPanel>
        </div>

        {/* Right Column: Important Tasks & Notifications */}
        <div className="lg:col-span-3 space-y-4 flex flex-col justify-between">
          <HudPanel title="THÔNG BÁO QUAN TRỌNG" subtitle="HADES ALERTS">
            <div className="space-y-2 py-1 max-h-[160px] overflow-y-auto">
              <div className="bg-[#020813]/60 border-l-2 border-[#00f0ff] p-2 rounded-r">
                <div className="flex items-center space-x-1 text-[#00f0ff] text-xs font-bold">
                  <Bell className="w-3 h-3" />
                  <span>Bảo mật hệ thống</span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5">
                  FastAPI Backend đang hoạt động với Session Capability Token an toàn.
                </p>
              </div>

              <div className="bg-[#020813]/60 border-l-2 border-[#ffaa00] p-2 rounded-r">
                <div className="flex items-center space-x-1 text-[#ffaa00] text-xs font-bold">
                  <Cpu className="w-3 h-3" />
                  <span>Trí tuệ Nhân tạo</span>
                </div>
                <p className="text-[11px] text-white/70 mt-0.5">
                  Vào Cài đặt để thêm Gemini API Key nếu muốn đàm thoại suy luận nâng cao.
                </p>
              </div>
            </div>
          </HudPanel>

          <HudPanel title="NHIỆM VỤ TRONG NGÀY" subtitle="AGENDA & DEADLINES">
            <div className="space-y-2 py-1 max-h-[160px] overflow-y-auto">
              <div className="flex items-center space-x-2 bg-[#020813]/60 p-2 rounded border border-[#00f0ff]/15">
                <CheckSquare className="w-4 h-4 text-[#00ff88]" />
                <div className="flex-1 truncate">
                  <div className="text-xs font-semibold text-white truncate">Khởi tạo HADES OS</div>
                  <div className="text-[9px] text-[#00f0ff]/60">Trạng thái: Hoàn thành</div>
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-[#020813]/60 p-2 rounded border border-[#00f0ff]/15">
                <CheckSquare className="w-4 h-4 text-[#ffaa00]" />
                <div className="flex-1 truncate">
                  <div className="text-xs font-semibold text-white truncate">Cập nhật Ngân sách tháng</div>
                  <div className="text-[9px] text-[#ffaa00]/70">Hạn chót: Hôm nay</div>
                </div>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>

      {/* Bottom Command Center Input Bar */}
      <div className="pt-2">
        <CommandBar />
      </div>
    </div>
  );
};
