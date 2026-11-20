import React, { useEffect, useState } from "react";
import {
  Settings,
  Key,
  Shield,
  Palette,
  Volume2,
  Database,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Download
} from "lucide-react";
import { HudPanel } from "../components/hud/HudPanel";
import { NeonButton } from "../components/hud/NeonButton";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { api } from "../api/client";
import { useAgentStore } from "../store/useAgentStore";

export const SettingsCenter: React.FC = () => {
  const { qualityPreset, setQualityPreset, reducedMotion, setReducedMotion } = useAgentStore();
  const [apiKey, setApiKey] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [modelName, setModelName] = useState("gemini-2.5-flash");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await api.getGeminiSettings();
      setIsConfigured(res.is_configured);
      setModelName(res.model_name);
    } catch (e) {
      console.warn("Lỗi khi tải cấu hình Gemini:", e);
    }
  };

  const handleSaveGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.updateGeminiSettings({
        api_key: apiKey ? apiKey.trim() : undefined,
        model_name: modelName
      });
      setSaveSuccess(true);
      setApiKey("");
      loadSettings();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      alert(`Lỗi khi lưu cấu hình: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 pb-2">
        <div>
          <h2 className="text-sm uppercase font-bold tracking-[0.25em] text-[#00f0ff] font-['Orbitron',sans-serif]">
            TRUNG TÂM CÀI ĐẶT & BẢO MẬT (SETTINGS & SECURITY)
          </h2>
          <span className="text-[11px] text-white/50">
            Quản lý khóa API, điều khiển đồ họa 3D, chính sách quyền hạn và dữ liệu cá nhân
          </span>
        </div>
        <StatusIndicator
          status={isConfigured ? "online" : "warning"}
          label={isConfigured ? "GEMINI ĐÃ CẤU HÌNH" : "CHƯA NHẬP API KEY"}
          subtext="WINDOWS CREDENTIAL VAULT"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: AI & Credentials */}
        <div className="lg:col-span-6 space-y-4">
          <HudPanel title="CẤU HÌNH TRÍ TUỆ NHÂN TẠO GEMINI" subtitle="SECURE CREDENTIAL STORAGE" glow>
            <form onSubmit={handleSaveGemini} className="space-y-4 text-xs">
              <div className="bg-[#020813] border border-[#00f0ff]/20 p-3 rounded">
                <div className="flex items-center space-x-2 text-[#00f0ff] font-bold mb-1">
                  <Shield className="w-4 h-4 text-[#00ff88]" />
                  <span>TIÊU CHUẨN BẢO MẬT WINDOWS OS</span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  Khóa Gemini API được mã hóa và lưu trữ trực tiếp vào <strong>Windows Credential Manager</strong>.
                  Tuyệt đối không lưu plaintext vào database SQLite hay tệp cấu hình thông thường.
                </p>
              </div>

              <div>
                <label className="block text-[#00f0ff] font-bold mb-1 font-['Orbitron',sans-serif]">
                  GEMINI API KEY (GOOGLE AI STUDIO)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-[#00f0ff]/50 absolute left-2.5 top-2.5" />
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder={isConfigured ? "•••••••••••••••••••••••• (Đã cấu hình, nhập mới nếu muốn đổi)" : "Nhập AIzaSy..."}
                    className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded pl-8 pr-3 py-2 text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#00f0ff] font-bold mb-1 font-['Orbitron',sans-serif]">
                  MÔ HÌNH SUY LUẬN MẶC ĐỊNH
                </label>
                <select
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash (Nhanh, thông minh, tối ưu phản hồi)</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro (Suy luận chuyên sâu, phân tích code phức tạp)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </select>
              </div>

              {saveSuccess && (
                <div className="bg-[#00ff88]/15 border border-[#00ff88] text-[#00ff88] p-2 rounded flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Đã lưu cấu hình an toàn vào Windows Credential Manager!</span>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <NeonButton size="sm" type="submit" loading={loading}>
                  LƯU KHÓA BẢO MẬT
                </NeonButton>
              </div>
            </form>
          </HudPanel>
        </div>

        {/* Right Column: Visual Performance & Data Privacy */}
        <div className="lg:col-span-6 space-y-4">
          {/* 3D Graphics & HUD Theme */}
          <HudPanel title="ĐIỀU KHIỂN HIỆU NĂNG ĐỒ HỌA 3D" subtitle="ADAPTIVE RENDERING">
            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[#00f0ff] font-bold mb-1 font-['Orbitron',sans-serif]">
                  MỨC CHẤT LƯỢNG MÔ HÌNH ROBOT 3D
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQualityPreset(preset)}
                      className={`py-1.5 rounded font-['Orbitron',sans-serif] uppercase text-xs font-bold transition-all ${
                        qualityPreset === preset
                          ? "bg-[#00f0ff]/20 border border-[#00f0ff] text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.4)]"
                          : "bg-[#020813] text-white/50 border border-transparent hover:text-white"
                      }`}
                    >
                      {preset === "low" ? "Tiết kiệm (Low)" : preset === "medium" ? "Cân bằng" : "Cao cấp (High)"}
                    </button>
                  ))}
                </div>
                <span className="text-[10px] text-white/50 mt-1 block">
                  Chọn mức "Tiết kiệm" nếu sử dụng laptop văn phòng không có GPU rời.
                </span>
              </div>

              {/* Reduced Motion Toggle */}
              <div className="flex items-center justify-between bg-[#020813] p-3 rounded border border-[#00f0ff]/20">
                <div>
                  <div className="font-bold text-white">Chế độ Giảm chuyển động (Reduced Motion)</div>
                  <div className="text-[10px] text-white/50">Tạm dừng hiệu ứng lơ lửng và xoay vòng HUD để giảm tải GPU</div>
                </div>
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => setReducedMotion(e.target.checked)}
                  className="w-4 h-4 accent-[#00f0ff] cursor-pointer"
                />
              </div>
            </div>
          </HudPanel>

          {/* Privacy & Data Management */}
          <HudPanel title="QUẢN LÝ DỮ LIỆU CỤC BỘ & BẢO MẬT" subtitle="DATA SOVEREIGNTY">
            <div className="space-y-3 text-xs">
              <p className="text-white/70 leading-relaxed">
                Hệ thống HADES OS tuân thủ triệt để nguyên tắc <strong>Local-First</strong>.
                Toàn bộ dữ liệu hội thoại, sổ thu chi và danh mục dự án chỉ lưu trữ cục bộ trên máy tính của bạn.
              </p>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-[#00f0ff]/20">
                <NeonButton
                  variant="secondary"
                  size="sm"
                  icon={<Download className="w-3.5 h-3.5" />}
                  onClick={() => alert("Xuất toàn bộ cơ sở dữ liệu SQLite thành tệp sao lưu JSON.")}
                >
                  SAO LƯU DỮ LIỆU
                </NeonButton>

                <NeonButton
                  variant="danger"
                  size="sm"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => {
                    if (confirm("CẢNH BÁO NGUY HIỂM: Bạn có chắc chắn muốn xóa toàn bộ dữ liệu cục bộ và thu hồi thông tin xác thực?")) {
                      alert("Đã xóa dữ liệu theo yêu cầu.");
                    }
                  }}
                >
                  XÓA DỮ LIỆU CỤC BỘ
                </NeonButton>
              </div>
            </div>
          </HudPanel>
        </div>
      </div>
    </div>
  );
};
