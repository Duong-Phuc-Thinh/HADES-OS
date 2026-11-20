import React, { useEffect, useState } from "react";
import {
  Coins,
  TrendingUp,
  TrendingDown,
  Plus,
  Trash2,
  Download,
  Upload,
  AlertCircle,
  FileSpreadsheet,
  PieChart as PieIcon
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { HudPanel } from "../components/hud/HudPanel";
import { NeonButton } from "../components/hud/NeonButton";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { api } from "../api/client";
import { FinanceAccount, FinanceCategory, FinanceTransaction, FinanceSummary } from "../types";

export const FinanceCenter: React.FC = () => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>([]);
  const [categories, setCategories] = useState<FinanceCategory[]>([]);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>([]);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Transaction Form State
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [payee, setPayee] = useState("");
  const [transactionType, setTransactionType] = useState<"expense" | "income">("expense");
  const [notes, setNotes] = useState("");
  const [dateStr, setDateStr] = useState(new Date().toISOString().split("T")[0]);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [accs, cats, txs, sum] = await Promise.all([
        api.getAccounts(),
        api.getCategories(),
        api.getTransactions({ limit: 50 }),
        api.getFinanceSummary(currentMonth, currentYear)
      ]);
      setAccounts(accs);
      setCategories(cats);
      setTransactions(txs.items);
      setSummary(sum);
      if (accs.length > 0 && !accountId) setAccountId(accs[0].id);
      if (cats.length > 0 && !categoryId) setCategoryId(cats[0].id);
    } catch (e: any) {
      console.warn("Lỗi khi tải dữ liệu tài chính:", e.message);
    }
  };

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const amountNum = parseInt(amountStr.replace(/\D/g, ""), 10);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg("Vui lòng nhập số tiền hợp lệ lớn hơn 0");
      return;
    }

    try {
      await api.createTransaction({
        account_id: accountId,
        category_id: categoryId,
        amount: amountNum,
        transaction_type: transactionType,
        transaction_date: dateStr,
        payee: payee.trim() || "Chi tiêu cá nhân",
        notes: notes.trim()
      });
      setShowAddModal(false);
      setAmountStr("");
      setPayee("");
      setNotes("");
      loadData();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa giao dịch này? Số dư tài khoản sẽ được hoàn lại tự động.")) {
      await api.deleteTransaction(id);
      loadData();
    }
  };

  const formatVND = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const pieData = summary?.category_distribution || [];

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 pb-2">
        <div>
          <h2 className="text-sm uppercase font-bold tracking-[0.25em] text-[#00f0ff] font-['Orbitron',sans-serif]">
            TRUNG TÂM TÀI CHÍNH CÁ NHÂN (FINANCE CENTER)
          </h2>
          <span className="text-[11px] text-white/50">
            Quản lý thu chi chính xác với đơn vị nguyên VND, biểu đồ trực quan và chống trùng lặp
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <NeonButton
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            THÊM GIAO DỊCH
          </NeonButton>
          <NeonButton
            variant="secondary"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => window.open("http://127.0.0.1:8765/api/finance/export-csv", "_blank")}
          >
            XUẤT CSV
          </NeonButton>
        </div>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="bg-[#051428] border border-[#00ff88]/30 rounded p-3 relative">
          <div className="flex items-center justify-between text-xs text-[#00ff88] mb-1 font-bold">
            <span className="font-['Orbitron',sans-serif]">TỔNG THU NHẬP (T{currentMonth})</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-['Orbitron',sans-serif] text-white">
            {formatVND(summary?.total_income || 0)}
          </div>
        </div>

        {/* Total Expense */}
        <div className="bg-[#051428] border border-[#ff3344]/30 rounded p-3 relative">
          <div className="flex items-center justify-between text-xs text-[#ff3344] mb-1 font-bold">
            <span className="font-['Orbitron',sans-serif]">TỔNG CHI TIÊU (T{currentMonth})</span>
            <TrendingDown className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-['Orbitron',sans-serif] text-white">
            {formatVND(summary?.total_expense || 0)}
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-[#051428] border border-[#00f0ff]/30 rounded p-3 relative">
          <div className="flex items-center justify-between text-xs text-[#00f0ff] mb-1 font-bold">
            <span className="font-['Orbitron',sans-serif]">TIẾT KIỆM THỰC TẾ</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-['Orbitron',sans-serif] text-[#00f0ff]">
            {formatVND(summary?.net_savings || 0)}
          </div>
        </div>

        {/* Accounts Overview */}
        <div className="bg-[#051428] border border-[#ffaa00]/30 rounded p-3 relative">
          <div className="flex items-center justify-between text-xs text-[#ffaa00] mb-1 font-bold">
            <span className="font-['Orbitron',sans-serif]">SỐ DƯ CÁC TÀI KHOẢN</span>
            <Coins className="w-4 h-4" />
          </div>
          <div className="text-xl font-bold font-['Orbitron',sans-serif] text-white">
            {formatVND(accounts.reduce((acc, a) => acc + a.current_balance, 0))}
          </div>
        </div>
      </div>

      {/* Main Grid: Transactions List & Category Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left: Transaction History */}
        <div className="lg:col-span-8">
          <HudPanel title="LỊCH SỬ GIAO DỊCH GẦN ĐÂY" subtitle="PROVENANCE & LEDGER">
            <div className="max-h-[440px] overflow-y-auto">
              {transactions.length === 0 ? (
                <div className="text-center py-12 text-white/40 italic text-xs">
                  Chưa có giao dịch tài chính nào được ghi lại. Hãy bấm "Thêm Giao Dịch" để bắt đầu.
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#00f0ff]/30 text-[#00f0ff] font-['Orbitron',sans-serif] text-[10px] uppercase">
                      <th className="py-2 px-2.5">Ngày</th>
                      <th className="py-2 px-2.5">Đối tác / Khoản</th>
                      <th className="py-2 px-2.5">Danh mục</th>
                      <th className="py-2 px-2.5">Tài khoản</th>
                      <th className="py-2 px-2.5 text-right">Số tiền (VND)</th>
                      <th className="py-2 px-2 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#00f0ff]/10">
                    {transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-[#00f0ff]/5 transition-colors">
                        <td className="py-2 px-2.5 text-white/50 text-[11px] font-mono">
                          {t.transaction_date}
                        </td>
                        <td className="py-2 px-2.5 font-bold text-white">
                          <div>{t.payee}</div>
                          {t.notes && <span className="text-[10px] text-white/40 font-normal">{t.notes}</span>}
                        </td>
                        <td className="py-2 px-2.5">
                          <span
                            className="text-[10px] px-2 py-0.5 rounded font-semibold"
                            style={{ backgroundColor: `${t.category_color}20`, color: t.category_color, border: `1px solid ${t.category_color}40` }}
                          >
                            {t.category_name}
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-white/70">{t.account_name}</td>
                        <td className={`py-2 px-2.5 text-right font-mono font-bold ${
                          t.transaction_type === "income" ? "text-[#00ff88]" : "text-[#ff3344]"
                        }`}>
                          {t.transaction_type === "income" ? "+" : "-"}
                          {formatVND(t.amount)}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="text-white/40 hover:text-[#ff3344] p-1 rounded transition-colors"
                            title="Xóa giao dịch"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </HudPanel>
        </div>

        {/* Right: Category Distribution Chart */}
        <div className="lg:col-span-4 space-y-4">
          <HudPanel title="PHÂN BỔ CHI TIÊU THEO DANH MỤC" subtitle="ANALYTICS BREAKDOWN">
            {pieData.length === 0 ? (
              <div className="text-center py-16 text-white/40 italic text-xs">
                Chưa có dữ liệu chi tiêu trong tháng này.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="amount"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color || "#00f0ff"} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => formatVND(Number(val))}
                        contentStyle={{ backgroundColor: "#020813", borderColor: "#00f0ff", fontSize: "11px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend List */}
                <div className="space-y-1.5 max-h-40 overflow-y-auto pt-2 border-t border-[#00f0ff]/15">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-white/80">{d.name}</span>
                      </div>
                      <span className="font-mono text-[#00f0ff] font-semibold">{formatVND(d.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </HudPanel>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#051428] border-2 border-[#00f0ff] rounded-lg max-w-md w-full p-5 space-y-4 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2">
              <h3 className="font-['Orbitron',sans-serif] font-bold text-sm text-[#00f0ff]">
                GHI NHẬN GIAO DỊCH MỚI
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-[#ff3344]/20 border border-[#ff3344] text-[#ff3344] text-xs p-2 rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateTransaction} className="space-y-3 text-xs">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTransactionType("expense")}
                  className={`py-1.5 rounded font-bold uppercase transition-all ${
                    transactionType === "expense"
                      ? "bg-[#ff3344]/30 border border-[#ff3344] text-[#ff8088]"
                      : "bg-[#020813] text-white/40"
                  }`}
                >
                  Khoản Chi
                </button>
                <button
                  type="button"
                  onClick={() => setTransactionType("income")}
                  className={`py-1.5 rounded font-bold uppercase transition-all ${
                    transactionType === "income"
                      ? "bg-[#00ff88]/30 border border-[#00ff88] text-[#00ff88]"
                      : "bg-[#020813] text-white/40"
                  }`}
                >
                  Khoản Thu
                </button>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">SỐ TIỀN (VND)</label>
                <input
                  type="text"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="Ví dụ: 50000 hoặc 1200000"
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white font-mono text-sm focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              {/* Payee */}
              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">ĐỐI TÁC / NỘI DUNG</label>
                <input
                  type="text"
                  required
                  value={payee}
                  onChange={(e) => setPayee(e.target.value)}
                  placeholder="Ví dụ: Cơm trưa, Mua sách, Shopee..."
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              {/* Category & Account */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#00f0ff]/80 font-bold mb-1">DANH MỤC</label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[#00f0ff]/80 font-bold mb-1">TÀI KHOẢN</label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">NGÀY GIAO DỊCH</label>
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">GHI CHÚ (TÙY CHỌN)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ghi chú chi tiết thêm..."
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#00f0ff]/20">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <NeonButton size="sm" type="submit">
                  LƯU GIAO DỊCH
                </NeonButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
