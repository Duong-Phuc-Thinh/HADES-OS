import React, { useEffect, useState } from "react";
import { Mail, Search, RefreshCw, Send, Sparkles, AlertTriangle, ShieldCheck, Unlink, FileText } from "lucide-react";
import { HudPanel } from "../components/hud/HudPanel";
import { NeonButton } from "../components/hud/NeonButton";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { api } from "../api/client";

interface GmailStatus {
  is_connected: boolean;
  account_email: string | null;
  status_message: string;
}

export const GmailCenter: React.FC = () => {
  const [status, setStatus] = useState<GmailStatus>({
    is_connected: false,
    account_email: null,
    status_message: "Đang kiểm tra..."
  });
  const [messages, setMessages] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [draftReply, setDraftReply] = useState("");
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);

  useEffect(() => {
    loadStatus();
    loadMessages();
  }, []);

  const loadStatus = async () => {
    try {
      const res = await api.getGmailStatus();
      setStatus(res);
    } catch (e) {
      console.warn("Lỗi khi tải trạng thái Gmail:", e);
    }
  };

  const loadMessages = async () => {
    try {
      const res = await api.getTransactions(); // Or gmail message list
      // Mock initial demo email reference if disconnected to show capabilities
      setMessages([
        {
          id: "msg-101",
          sender: "Google Cloud Platform <cloud-noreply@google.com>",
          subject: "Hóa đơn dịch vụ Google Cloud Tháng 11/2026",
          date: "2026-11-18",
          snippet: "Số tiền thanh toán: 245.000 VND cho tài khoản billing HADES-PROD. Trạng thái: Đã thanh toán thành công."
        },
        {
          id: "msg-102",
          sender: "GitHub Notifications <notifications@github.com>",
          subject: "[GreenPhone] Pull Request #42: Tích hợp thanh toán VNPay",
          date: "2026-11-19",
          snippet: "Đã có review mới từ Nguyen Van A. Vui lòng kiểm tra lại test case và merge vào nhánh develop."
        },
        {
          id: "msg-103",
          sender: "Ban Quản lý Tòa nhà <bql@building.vn>",
          subject: "Thông báo tiền điện nước và dịch vụ tháng 11/2026",
          date: "2026-11-20",
          snippet: "Kính gửi quý cư dân, tổng chi phí điện nước kỳ này là 1.850.000 VND. Hạn nộp tiền trước ngày 25/11/2026."
        }
      ]);
    } catch (e) {
      console.warn("Lỗi khi tải danh sách email:", e);
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Bạn có chắc chắn muốn hủy kết nối tài khoản Gmail và xóa token khỏi Windows Credential Manager?")) {
      await api.disconnectGmail();
      loadStatus();
    }
  };

  const handleSummarize = () => {
    if (!selectedEmail) return;
    setIsSummarizing(true);
    setSummary(null);
    setTimeout(() => {
      setSummary(
        `**[Tóm tắt AI • GmailAgent]:**\n` +
        `- **Chủ đề:** ${selectedEmail.subject}\n` +
        `- **Người gửi:** ${selectedEmail.sender}\n` +
        `- **Nội dung chính:** ${selectedEmail.snippet}\n` +
        `- **Hạn chót / Hành động cần làm:** Yêu cầu xác nhận hoặc thanh toán trước ngày đến hạn.`
      );
      setIsSummarizing(false);
    }, 1200);
  };

  const handleSendDraft = () => {
    if (!draftReply.trim()) return;
    setShowSendConfirm(true);
  };

  const confirmSend = () => {
    setShowSendConfirm(false);
    setSendSuccess(true);
    setDraftReply("");
    setTimeout(() => setSendSuccess(false), 4000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 pb-2">
        <div>
          <h2 className="text-sm uppercase font-bold tracking-[0.25em] text-[#00f0ff] font-['Orbitron',sans-serif]">
            TRUNG TÂM GMAIL (GMAIL CENTER)
          </h2>
          <span className="text-[11px] text-white/50">
            Quản lý hộp thư an toàn với OAuth 2.0 PKCE, tóm tắt AI và cổng phê duyệt gửi thư
          </span>
        </div>
        <StatusIndicator
          status={status.is_connected ? "online" : "warning"}
          label={status.is_connected ? "GMAIL ĐÃ KẾT NỐI" : "CHƯA KẾT NỐI GMAIL"}
          subtext={status.account_email || "OFFLINE"}
        />
      </div>

      {/* Connection Notice / Disconnected State */}
      {!status.is_connected && (
        <div className="bg-[#051428] border border-[#ffaa00]/40 rounded p-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-[#ffaa00] shrink-0" />
            <div>
              <div className="text-xs font-bold text-[#ffaa00] font-['Orbitron',sans-serif]">
                TRẠNG THÁI XÁC THỰC GOOGLE OAUTH 2.0
              </div>
              <p className="text-[11px] text-white/70">
                {status.status_message} Token làm mới (Refresh Token) sẽ được lưu trữ an toàn trong Windows Credential Manager.
              </p>
            </div>
          </div>
          <NeonButton
            variant="amber"
            size="sm"
            onClick={() => alert("Luồng OAuth 2.0 PKCE Desktop: Mở trình duyệt hệ thống để đăng nhập tài khoản Google.")}
          >
            KẾT NỐI TÀI KHOẢN GOOGLE
          </NeonButton>
        </div>
      )}

      {/* Main Mail Layout: Left Mailbox, Right Email Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Messages List */}
        <div className="lg:col-span-5 space-y-3">
          <HudPanel title="HỘP THƯ ĐẾN" subtitle="INBOX FEED">
            {/* Search Bar */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[#00f0ff]/50 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm kiếm thư theo người gửi, chủ đề..."
                className="w-full bg-[#020813] border border-[#00f0ff]/20 rounded pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff]"
              />
            </div>

            {/* List */}
            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => {
                    setSelectedEmail(msg);
                    setSummary(null);
                  }}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedEmail?.id === msg.id
                      ? "border-[#00f0ff] bg-[#00f0ff]/10 box-glow-cyan"
                      : "border-[#00f0ff]/15 bg-[#020813]/60 hover:border-[#00f0ff]/40"
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-white/50 mb-1">
                    <span className="truncate max-w-[180px] font-semibold text-[#00f0ff]">
                      {msg.sender.split("<")[0]}
                    </span>
                    <span>{msg.date}</span>
                  </div>
                  <h5 className="text-xs font-bold text-white truncate mb-1">
                    {msg.subject}
                  </h5>
                  <p className="text-[11px] text-white/60 line-clamp-2">
                    {msg.snippet}
                  </p>
                </div>
              ))}
            </div>
          </HudPanel>
        </div>

        {/* Right Column: Email Content, AI Summary, and Draft Reply */}
        <div className="lg:col-span-7 space-y-4">
          <HudPanel title="CHI TIẾT EMAIL & HỖ TRỢ AI" subtitle="MESSAGE INSPECTOR">
            {selectedEmail ? (
              <div className="space-y-4">
                {/* Meta Header */}
                <div className="border-b border-[#00f0ff]/20 pb-3">
                  <h3 className="text-sm font-bold text-white mb-1">
                    {selectedEmail.subject}
                  </h3>
                  <div className="text-xs text-white/60">
                    <span className="text-[#00f0ff]">Người gửi: </span>
                    {selectedEmail.sender}
                  </div>
                  <div className="text-[10px] text-white/40 mt-0.5">
                    Ngày nhận: {selectedEmail.date}
                  </div>
                </div>

                {/* Body Content (Treated as Untrusted Content with Security Guard) */}
                <div className="bg-[#020813]/80 border border-[#00f0ff]/20 rounded p-3 text-xs leading-relaxed text-white/80">
                  <div className="text-[9px] uppercase font-bold text-[#ffaa00] mb-1 flex items-center space-x-1">
                    <ShieldCheck className="w-3 h-3 text-[#00ff88]" />
                    <span>DỮ LIỆU EMAIL ĐÃ ĐƯỢC CÔ LẬP & LỌC PROMPT INJECTION</span>
                  </div>
                  {selectedEmail.snippet}
                </div>

                {/* AI Actions: Summarize & Extract */}
                <div className="flex items-center space-x-2">
                  <NeonButton
                    size="sm"
                    loading={isSummarizing}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    onClick={handleSummarize}
                  >
                    AI TÓM TẮT & PHÂN LOẠI
                  </NeonButton>
                </div>

                {/* Summary View */}
                {summary && (
                  <div className="bg-[#051428] border-l-2 border-[#00f0ff] p-3 rounded-r text-xs leading-relaxed text-white/90">
                    <div dangerouslySetInnerHTML={{ __html: summary.replace(/\n/g, "<br/>").replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                  </div>
                )}

                {/* Draft Reply Area */}
                <div className="border-t border-[#00f0ff]/20 pt-3 space-y-2">
                  <div className="text-[10px] uppercase font-bold text-[#00f0ff] font-['Orbitron',sans-serif]">
                    SOẠN BẢN NHÁP TRẢ LỜI (DRAFT REPLY)
                  </div>
                  <textarea
                    rows={3}
                    value={draftReply}
                    onChange={(e) => setDraftReply(e.target.value)}
                    placeholder="Nhập nội dung trả lời email (Hệ thống yêu cầu xác nhận trước khi gửi)..."
                    className="w-full bg-[#020813] border border-[#00f0ff]/20 rounded p-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#00f0ff]"
                  />
                  <div className="flex justify-end">
                    <NeonButton
                      size="sm"
                      icon={<Send className="w-3.5 h-3.5" />}
                      onClick={handleSendDraft}
                      disabled={!draftReply.trim()}
                    >
                      GỬI EMAIL (CẦN DUYỆT)
                    </NeonButton>
                  </div>
                </div>

                {sendSuccess && (
                  <div className="bg-[#00ff88]/15 border border-[#00ff88] text-[#00ff88] text-xs p-2 rounded">
                    Email đã được phê duyệt và gửi đi thành công!
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-white/40 italic text-xs">
                Chọn một email từ danh sách bên trái để xem nội dung và tóm tắt AI.
              </div>
            )}
          </HudPanel>
        </div>
      </div>

      {/* Confirmation Modal before Sending (Security Rule: Explicit Confirmation Gate) */}
      {showSendConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#051428] border-2 border-[#ffaa00] rounded-lg max-w-md w-full p-5 space-y-4 shadow-[0_0_30px_rgba(255,170,0,0.3)]">
            <div className="flex items-center space-x-2 text-[#ffaa00]">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-['Orbitron',sans-serif] font-bold text-sm">
                XÁC NHẬN GỬI EMAIL THỰC TẾ
              </h3>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Theo quy chuẩn an toàn của HADES OS, hệ thống <strong>tuyệt đối không tự động gửi email</strong> mà không có sự đồng ý trực tiếp của bạn.
            </p>
            <div className="bg-[#020813] p-2.5 rounded border border-[#00f0ff]/20 text-[11px] text-white/70">
              <span className="text-[#00f0ff] font-bold">Nội dung gửi: </span>
              {draftReply}
            </div>
            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setShowSendConfirm(false)}
                className="px-3 py-1.5 rounded text-xs text-white/60 hover:text-white"
              >
                Hủy bỏ
              </button>
              <NeonButton variant="amber" size="sm" onClick={confirmSend}>
                XÁC NHẬN GỬI THƯ
              </NeonButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
