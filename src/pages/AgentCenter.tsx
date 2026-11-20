import React, { useEffect, useState } from "react";
import { Bot, Mail, Coins, Code2, CheckSquare, Cpu, ShieldAlert, CheckCircle, Clock } from "lucide-react";
import { HudPanel } from "../components/hud/HudPanel";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { NeonButton } from "../components/hud/NeonButton";
import { api } from "../api/client";
import { useAgentStore } from "../store/useAgentStore";

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  status: "idle" | "working" | "waiting" | "completed" | "failed";
  icon: React.ReactNode;
  description: string;
}

export const AgentCenter: React.FC = () => {
  const { currentAgent } = useAgentStore();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<string>("Orchestrator");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (e) {
      console.warn("Lỗi khi tải nhật ký kiểm toán:", e);
    }
  };

  const agents: AgentInfo[] = [
    {
      id: "GmailAgent",
      name: "Tác nhân Gmail",
      role: "Quản lý hộp thư & Soạn thảo",
      status: currentAgent.includes("Gmail") ? "working" : "idle",
      icon: <Mail className="w-5 h-5 text-[#ff8088]" />,
      description: "Tóm tắt email, phân loại thông minh, hỗ trợ tạo bản nháp và trích xuất hóa đơn."
    },
    {
      id: "FinanceAgent",
      name: "Tác nhân Tài chính",
      role: "Quản lý Chi tiêu VND",
      status: currentAgent.includes("Finance") ? "working" : "idle",
      icon: <Coins className="w-5 h-5 text-[#00f0ff]" />,
      description: "Tính toán thu chi chính xác, cảnh báo vượt ngân sách, nhập/xuất CSV và chống trùng lặp."
    },
    {
      id: "CodingAgent",
      name: "Tác nhân Lập trình",
      role: "Kiểm tra Mã nguồn & Git",
      status: currentAgent.includes("Coding") ? "working" : "idle",
      icon: <Code2 className="w-5 h-5 text-[#00ff88]" />,
      description: "Đọc trạng thái Git chỉ đọc, chuẩn hóa dự án Spring Boot / React và đánh giá mã nguồn."
    },
    {
      id: "ProductivityAgent",
      name: "Tác nhân Năng suất",
      role: "Quản lý Công việc & Lịch trình",
      status: currentAgent.includes("Productivity") ? "working" : "idle",
      icon: <CheckSquare className="w-5 h-5 text-[#ffaa00]" />,
      description: "Theo dõi nhiệm vụ, nhắc nhở hạn chót và quản lý tiến độ công việc hàng ngày."
    },
    {
      id: "SystemAgent",
      name: "Tác nhân Hệ thống",
      role: "Giám sát Windows",
      status: currentAgent.includes("System") ? "working" : "idle",
      icon: <Cpu className="w-5 h-5 text-[#a855f7]" />,
      description: "Đọc phần cứng CPU, RAM, Ổ cứng và tình trạng kết nối mạng của máy tính."
    }
  ];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2">
        <div>
          <h2 className="text-sm uppercase font-bold tracking-[0.25em] text-[#00f0ff] font-['Orbitron',sans-serif]">
            TRUNG TÂM CHỈ HUY TÁC NHÂN (AGENT COMMAND CENTER)
          </h2>
          <span className="text-[11px] text-white/50">
            Sơ đồ điều phối luồng công việc đa tác nhân và phê duyệt hành động hệ thống
          </span>
        </div>
        <StatusIndicator status="online" label="ĐIỀU PHỐI TẬP TRUNG" subtext="ORCHESTRATOR ONLINE" />
      </div>

      {/* Main Orchestrator Visualization & Connected Nodes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Agent Network Canvas */}
        <div className="lg:col-span-8">
          <HudPanel title="MẠNG LƯỚI TÁC NHÂN CHUYÊN MÔN" subtitle="WORKFLOW ORCHESTRATION" glow>
            {/* Central Orchestrator Node */}
            <div className="flex justify-center my-6">
              <div className="relative bg-[#020813] border-2 border-[#00f0ff] rounded-lg p-4 w-72 text-center box-glow-active">
                <div className="w-10 h-10 rounded-full bg-[#00f0ff]/20 border border-[#00f0ff] mx-auto flex items-center justify-center mb-2 shadow-[0_0_12px_#00f0ff]">
                  <Bot className="w-6 h-6 text-[#00f0ff]" />
                </div>
                <h4 className="font-['Orbitron',sans-serif] font-bold text-sm text-[#00f0ff]">
                  HADES ORCHESTRATOR
                </h4>
                <div className="text-[10px] text-white/60 tracking-wider">Bộ não trung tâm điều phối tác vụ</div>
                <div className="mt-2 inline-flex items-center space-x-1.5 text-[9px] font-bold uppercase tracking-widest text-[#00ff88] bg-[#00ff88]/10 px-2 py-0.5 rounded border border-[#00ff88]/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-ping" />
                  <span>SẴN SÀNG TIẾP NHẬN LỆNH</span>
                </div>
              </div>
            </div>

            {/* Subordinate Agents Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
              {agents.map((ag) => (
                <div
                  key={ag.id}
                  onClick={() => setSelectedAgent(ag.id)}
                  className={`bg-[#020813]/80 border rounded p-3 cursor-pointer transition-all duration-200 ${
                    selectedAgent === ag.id
                      ? "border-[#00f0ff] box-glow-cyan bg-[#00f0ff]/5"
                      : "border-[#00f0ff]/20 hover:border-[#00f0ff]/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="p-1.5 rounded bg-[#051428] border border-[#00f0ff]/30">
                      {ag.icon}
                    </div>
                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                      ag.status === "working"
                        ? "bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 animate-pulse"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {ag.status === "working" ? "ĐANG XỬ LÝ" : "CHỜ LỆNH"}
                    </span>
                  </div>
                  <h5 className="font-['Orbitron',sans-serif] text-xs font-bold text-white mb-0.5">
                    {ag.name}
                  </h5>
                  <p className="text-[10px] text-[#00f0ff]/60 leading-tight">
                    {ag.role}
                  </p>
                </div>
              ))}
            </div>
          </HudPanel>
        </div>

        {/* Right: Selected Agent Detail & Pending Approvals */}
        <div className="lg:col-span-4 space-y-4">
          <HudPanel title="CHI TIẾT TÁC NHÂN" subtitle="CAPABILITY SPEC">
            {(() => {
              const current = agents.find((a) => a.id === selectedAgent) || agents[0];
              return (
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    {current.icon}
                    <div>
                      <h4 className="text-sm font-bold text-[#00f0ff] font-['Orbitron',sans-serif]">
                        {current.name}
                      </h4>
                      <span className="text-[10px] text-white/50">{current.id}</span>
                    </div>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed bg-[#020813]/60 p-2.5 rounded border border-[#00f0ff]/20">
                    {current.description}
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div className="text-[10px] uppercase font-bold text-[#00f0ff]/70 tracking-wider">
                      QUYỀN HẠN ĐƯỢC PHÉP:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      <span className="text-[9px] bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 px-2 py-0.5 rounded">
                        READ_LOCAL
                      </span>
                      <span className="text-[9px] bg-[#00ff88]/10 text-[#00ff88] border border-[#00ff88]/30 px-2 py-0.5 rounded">
                        DENY_BY_DEFAULT
                      </span>
                      <span className="text-[9px] bg-[#ffaa00]/10 text-[#ffaa00] border border-[#ffaa00]/30 px-2 py-0.5 rounded">
                        APPROVAL_GATED
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </HudPanel>

          {/* Pending Approval Gate */}
          <HudPanel title="HÀNG ĐỢI PHÊ DUYỆT (APPROVAL GATE)" subtitle="SENSITIVE ACTIONS">
            <div className="text-xs text-white/50 italic text-center py-4 bg-[#020813]/60 rounded border border-[#00f0ff]/15">
              <CheckCircle className="w-5 h-5 text-[#00ff88] mx-auto mb-1" />
              Không có hành động nhạy cảm nào đang chờ phê duyệt.
            </div>
          </HudPanel>
        </div>
      </div>

      {/* Bottom: Real Execution History Audit Log */}
      <HudPanel title="NHẬT KÝ THỰC THI THỰC TẾ (AUDIT LOGS)" subtitle="REAL-TIME TELEMETRY">
        <div className="max-h-56 overflow-y-auto">
          {auditLogs.length === 0 ? (
            <div className="text-xs text-white/40 italic text-center py-4">
              Chưa có bản ghi thực thi công cụ.
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#00f0ff]/30 text-[#00f0ff] font-['Orbitron',sans-serif] text-[10px] uppercase">
                  <th className="py-1.5 px-2">Thời gian</th>
                  <th className="py-1.5 px-2">Tác nhân</th>
                  <th className="py-1.5 px-2">Hành động</th>
                  <th className="py-1.5 px-2">Phân loại</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#00f0ff]/10">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#00f0ff]/5 transition-colors">
                    <td className="py-1.5 px-2 text-white/50 text-[10px]">
                      {new Date(log.created_at).toLocaleTimeString("vi-VN")}
                    </td>
                    <td className="py-1.5 px-2 font-bold text-white">{log.actor}</td>
                    <td className="py-1.5 px-2 text-[#00f0ff] font-mono text-[11px]">{log.action}</td>
                    <td className="py-1.5 px-2">
                      <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#00f0ff]/30 bg-[#00f0ff]/10 text-[#00f0ff]">
                        {log.event_type}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </HudPanel>
    </div>
  );
};
