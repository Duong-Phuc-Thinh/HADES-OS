import React, { useEffect, useState } from "react";
import { CheckSquare, Plus, Trash2, Calendar, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { HudPanel } from "../components/hud/HudPanel";
import { NeonButton } from "../components/hud/NeonButton";
import { api } from "../api/client";
import { TaskItem } from "../types";

export const ProductivityCenter: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [filter, setFilter] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "URGENT">("MEDIUM");
  const [dueDate, setDueDate] = useState("");

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (e) {
      console.warn("Lỗi khi tải danh sách công việc:", e);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await api.createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : undefined
      });
      setShowAddModal(false);
      setTitle("");
      setDescription("");
      setDueDate("");
      loadTasks();
    } catch (e: any) {
      alert(`Lỗi khi tạo nhiệm vụ: ${e.message}`);
    }
  };

  const toggleTaskStatus = async (task: TaskItem) => {
    const nextStatus = task.status === "DONE" ? "TODO" : "DONE";
    try {
      await api.updateTask(task.id, { status: nextStatus });
      loadTasks();
    } catch (e: any) {
      console.warn("Lỗi khi cập nhật trạng thái nhiệm vụ:", e);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhiệm vụ này?")) {
      await api.deleteTask(id);
      loadTasks();
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (filter === "ALL") return true;
    return t.status === filter;
  });

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case "URGENT":
        return "bg-[#ff3344]/20 text-[#ff8088] border-[#ff3344]/50";
      case "HIGH":
        return "bg-[#ffaa00]/20 text-[#ffcc66] border-[#ffaa00]/50";
      case "LOW":
        return "bg-slate-800 text-slate-400 border-slate-700";
      case "MEDIUM":
      default:
        return "bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/40";
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 pb-2">
        <div>
          <h2 className="text-sm uppercase font-bold tracking-[0.25em] text-[#00f0ff] font-['Orbitron',sans-serif]">
            TRUNG TÂM NĂNG SUẤT (PRODUCTIVITY CENTER)
          </h2>
          <span className="text-[11px] text-white/50">
            Quản lý nhiệm vụ cá nhân, theo dõi tiến độ và cảnh báo hạn chót
          </span>
        </div>
        <NeonButton
          size="sm"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowAddModal(true)}
        >
          THÊM NHIỆM VỤ MỚI
        </NeonButton>
      </div>

      {/* Task Filters */}
      <div className="flex items-center space-x-2">
        {["ALL", "TODO", "IN_PROGRESS", "DONE"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded text-xs font-['Orbitron',sans-serif] font-semibold transition-all ${
              filter === f
                ? "bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]"
                : "bg-[#020813] text-white/50 hover:text-white"
            }`}
          >
            {f === "ALL" ? "TẤT CẢ" : f === "TODO" ? "CẦN LÀM" : f === "IN_PROGRESS" ? "ĐANG LÀM" : "HOÀN THÀNH"}
          </button>
        ))}
      </div>

      {/* Tasks List */}
      <HudPanel title="DANH SÁCH CÔNG VIỆC" subtitle="TASK TRACKER">
        <div className="space-y-2 max-h-[520px] overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 text-white/40 italic text-xs">
              Không có nhiệm vụ nào trong danh mục này.
            </div>
          ) : (
            filteredTasks.map((t) => (
              <div
                key={t.id}
                className="bg-[#020813]/70 border border-[#00f0ff]/20 rounded p-3 flex items-center justify-between hover:border-[#00f0ff]/40 transition-colors"
              >
                <div className="flex items-start space-x-3 flex-1 min-w-0 mr-4">
                  <button
                    onClick={() => toggleTaskStatus(t)}
                    className="mt-0.5 text-white/40 hover:text-[#00ff88] transition-colors"
                  >
                    {t.status === "DONE" ? (
                      <CheckCircle2 className="w-5 h-5 text-[#00ff88]" />
                    ) : (
                      <div className="w-5 h-5 rounded border border-[#00f0ff]/50" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <h4 className={`text-xs font-bold text-white truncate ${t.status === "DONE" ? "line-through text-white/40" : ""}`}>
                      {t.title}
                    </h4>
                    {t.description && (
                      <p className="text-[11px] text-white/60 line-clamp-1 mt-0.5">
                        {t.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-1 text-[10px] text-white/40">
                      {t.due_date && (
                        <div className="flex items-center space-x-1 text-[#ffaa00]">
                          <Clock className="w-3 h-3" />
                          <span>Hạn: {new Date(t.due_date).toLocaleDateString("vi-VN")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 shrink-0">
                  <span className={`text-[9px] uppercase px-2 py-0.5 rounded border font-semibold ${getPriorityBadge(t.priority)}`}>
                    {t.priority}
                  </span>
                  <button
                    onClick={() => handleDeleteTask(t.id)}
                    className="text-white/30 hover:text-[#ff3344] p-1 rounded transition-colors"
                    title="Xóa nhiệm vụ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </HudPanel>

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#051428] border-2 border-[#00f0ff] rounded-lg max-w-md w-full p-5 space-y-4 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2">
              <h3 className="font-['Orbitron',sans-serif] font-bold text-sm text-[#00f0ff]">
                TẠO NHIỆM VỤ MỚI
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">TIÊU ĐỀ CÔNG VIỆC</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ví dụ: Kiểm tra cấu hình Spring Boot, hoàn thiện hóa đơn..."
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">CHI TIẾT MÔ TẢ</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Nội dung chi tiết..."
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#00f0ff]/80 font-bold mb-1">MỨC ĐỘ ƯU TIÊN</label>
                  <select
                    value={priority}
                    onChange={(e: any) => setPriority(e.target.value)}
                    className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="LOW">Thấp (Low)</option>
                    <option value="MEDIUM">Trung bình (Medium)</option>
                    <option value="HIGH">Cao (High)</option>
                    <option value="URGENT">Khẩn cấp (Urgent)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#00f0ff]/80 font-bold mb-1">HẠN HOÀN THÀNH</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
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
                  LƯU CÔNG VIỆC
                </NeonButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
