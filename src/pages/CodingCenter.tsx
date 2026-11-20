import React, { useEffect, useState } from "react";
import {
  Code2,
  FolderGit2,
  GitBranch,
  GitCommit,
  GitPullRequest,
  CheckCircle,
  FileCode,
  Sparkles,
  Plus,
  RefreshCw,
  Terminal
} from "lucide-react";
import { HudPanel } from "../components/hud/HudPanel";
import { NeonButton } from "../components/hud/NeonButton";
import { StatusIndicator } from "../components/hud/StatusIndicator";
import { api } from "../api/client";
import { RegisteredProject, GitStatus } from "../types";

export const CodingCenter: React.FC = () => {
  const [projects, setProjects] = useState<RegisteredProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [gitCommits, setGitCommits] = useState<string[]>([]);
  const [gitDiff, setGitDiff] = useState<string | null>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [aiReviewOutput, setAiReviewOutput] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // New Project Form
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectPath, setNewProjectPath] = useState("");
  const [newProjectType, setNewProjectType] = useState("spring_boot");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const list = await api.getProjects();
      setProjects(list);
      if (list.length > 0 && !selectedProjectId) {
        selectProject(list[0].id);
      }
    } catch (e: any) {
      console.warn("Lỗi khi tải danh mục dự án:", e.message);
    }
  };

  const selectProject = async (id: string) => {
    setSelectedProjectId(id);
    setAiReviewOutput(null);
    try {
      const [status, log, diff] = await Promise.all([
        api.getGitStatus(id),
        api.getGitLog(id),
        api.getGitDiff(id)
      ]);
      setGitStatus(status);
      setGitCommits(log.commits);
      setGitDiff(diff.diff);
    } catch (e: any) {
      console.warn("Lỗi khi đọc trạng thái Git:", e.message);
    }
  };

  const handleRegisterProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    try {
      await api.registerProject({
        name: newProjectName.trim(),
        path: newProjectPath.trim(),
        project_type: newProjectType
      });
      setShowAddProject(false);
      setNewProjectName("");
      setNewProjectPath("");
      loadProjects();
    } catch (e: any) {
      setErrorMsg(e.message);
    }
  };

  const handleAiCodeReview = () => {
    const proj = projects.find((p) => p.id === selectedProjectId);
    if (!proj) return;

    setIsReviewing(true);
    setTimeout(() => {
      let standards = "";
      if (proj.project_type === "spring_boot") {
        standards =
          "**Chuẩn kiến trúc Spring Boot:**\n" +
          "- Kiểm tra phân tầng Controller -> Service -> Repository.\n" +
          "- Bảo đảm tính toàn vẹn Transaction (`@Transactional` đúng chỗ).\n" +
          "- Bắt lỗi ngoại lệ tập trung qua `@RestControllerAdvice` và trả về thông báo Tiếng Việt.\n" +
          "- Tránh lạm dụng Lombok `@Data` trên JPA Entities.\n\n" +
          "**Đề xuất Commit Message Chuẩn:**\n" +
          "`feat(core): hoàn thiện cấu trúc dịch vụ và bổ sung kiểm thử đơn vị`";
      } else {
        standards =
          "**Chuẩn mã nguồn React & TypeScript:**\n" +
          "- TypeScript Strict Mode: không dùng `any` bừa bãi.\n" +
          "- Modular Feature Components tái sử dụng tốt.\n" +
          "- Quản lý trạng thái bất đồng bộ và xử lý Error Boundary rõ ràng.\n\n" +
          "**Đề xuất Commit Message Chuẩn:**\n" +
          "`refactor(ui): tối ưu hóa component hiển thị và kiểm tra kiểu dữ liệu strict`";
      }

      setAiReviewOutput(
        `**[Báo cáo Đánh giá Mã nguồn • CodingAgent]**\n\n` +
        `Dự án: **${proj.name}** (${proj.project_type})\n` +
        `Nhánh hiện tại: **${gitStatus?.current_branch || "main"}**\n\n` +
        standards
      );
      setIsReviewing(false);
    }, 1500);
  };

  const selectedProj = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto hud-scanline">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#00f0ff]/20 pb-2">
        <div>
          <h2 className="text-sm uppercase font-bold tracking-[0.25em] text-[#00f0ff] font-['Orbitron',sans-serif]">
            TRUNG TÂM LẬP TRÌNH (CODING CENTER)
          </h2>
          <span className="text-[11px] text-white/50">
            Quản lý kho Git cục bộ an toàn, chuẩn hóa kiến trúc Spring Boot / React và đánh giá mã nguồn AI
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <NeonButton
            size="sm"
            icon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setShowAddProject(true)}
          >
            ĐĂNG KÝ DỰ ÁN MỚI
          </NeonButton>
        </div>
      </div>

      {/* Main Grid: Left Projects List, Center Git Status & Diff, Right AI Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1">
        {/* Left Column: Allowlisted Projects */}
        <div className="lg:col-span-4 space-y-3">
          <HudPanel title="DANH MỤC DỰ ÁN CHO PHÉP" subtitle="ALLOWLISTED REPOSITORIES">
            <div className="space-y-2 max-h-[460px] overflow-y-auto">
              {projects.length === 0 ? (
                <div className="text-center py-10 text-white/40 italic text-xs">
                  Chưa có dự án nào được đăng ký. Bấm "Đăng Ký Dự Án Mới" để liên kết thư mục code.
                </div>
              ) : (
                projects.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => selectProject(p.id)}
                    className={`p-3 rounded border cursor-pointer transition-all ${
                      selectedProjectId === p.id
                        ? "border-[#00f0ff] bg-[#00f0ff]/10 box-glow-cyan"
                        : "border-[#00f0ff]/20 bg-[#020813]/60 hover:border-[#00f0ff]/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-xs font-['Orbitron',sans-serif]">
                        {p.name}
                      </span>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30">
                        {p.project_type}
                      </span>
                    </div>
                    <div className="text-[10px] text-white/50 truncate font-mono">
                      {p.repositories[0]?.local_path}
                    </div>
                  </div>
                ))
              )}
            </div>
          </HudPanel>
        </div>

        {/* Center & Right Column: Project Status, Git Inspector, and AI Review */}
        <div className="lg:col-span-8 space-y-4">
          {selectedProj ? (
            <>
              {/* Git Overview Bar */}
              <div className="bg-[#051428] border border-[#00f0ff]/30 rounded p-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center space-x-3">
                  <GitBranch className="w-5 h-5 text-[#00f0ff]" />
                  <div>
                    <div className="text-xs font-bold text-white">
                      Nhánh hiện tại: <span className="text-[#00f0ff] font-mono">{gitStatus?.current_branch || "N/A"}</span>
                    </div>
                    <div className="text-[10px] text-white/50">
                      Trạng thái: {gitStatus?.is_clean ? "Thư mục làm việc sạch sẽ (Clean)" : "Có thay đổi chưa commit"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <NeonButton
                    size="sm"
                    loading={isReviewing}
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                    onClick={handleAiCodeReview}
                  >
                    AI CODE REVIEW
                  </NeonButton>
                  <button
                    onClick={() => selectProject(selectedProj.id)}
                    className="p-1.5 rounded text-[#00f0ff] hover:bg-[#00f0ff]/20"
                    title="Làm mới trạng thái Git"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* AI Code Review Report if generated */}
              {aiReviewOutput && (
                <HudPanel title="BÁO CÁO ĐÁNH GIÁ MÃ NGUỒN (AI REVIEW)" subtitle="CODING AGENT">
                  <div
                    className="text-xs leading-relaxed text-white/90 bg-[#020813] p-3 rounded border border-[#00f0ff]/30 font-sans"
                    dangerouslySetInnerHTML={{
                      __html: aiReviewOutput
                        .replace(/\n/g, "<br/>")
                        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        .replace(/`(.*?)`/g, "<code class='text-[#00f0ff] bg-[#051428] px-1 py-0.5 rounded'>$1</code>")
                    }}
                  />
                </HudPanel>
              )}

              {/* Git Commits & Diff Tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Recent Commits */}
                <HudPanel title="LỊCH SỬ COMMIT GẦN ĐÂY" subtitle="GIT LOG">
                  <div className="space-y-1.5 max-h-56 overflow-y-auto text-xs font-mono">
                    {gitCommits.length === 0 ? (
                      <div className="text-white/40 italic py-4 text-center">Chưa có commit nào.</div>
                    ) : (
                      gitCommits.map((c, i) => (
                        <div key={i} className="flex items-center space-x-2 text-white/80 py-0.5 truncate">
                          <GitCommit className="w-3.5 h-3.5 text-[#00f0ff] shrink-0" />
                          <span className="truncate">{c}</span>
                        </div>
                      ))
                    )}
                  </div>
                </HudPanel>

                {/* Uncommitted Diff Viewer */}
                <HudPanel title="THAY ĐỔI CHƯA COMMIT" subtitle="GIT DIFF">
                  <div className="max-h-56 overflow-y-auto bg-[#020813] p-2.5 rounded font-mono text-[10px] text-white/70 whitespace-pre">
                    {gitDiff ? gitDiff : "Không có thay đổi nào trong thư mục làm việc."}
                  </div>
                </HudPanel>
              </div>
            </>
          ) : (
            <div className="text-center py-24 text-white/40 italic text-xs">
              Vui lòng chọn hoặc đăng ký một dự án để xem trạng thái Git và thực hiện đánh giá mã nguồn.
            </div>
          )}
        </div>
      </div>

      {/* Add Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#051428] border-2 border-[#00f0ff] rounded-lg max-w-md w-full p-5 space-y-4 shadow-[0_0_25px_rgba(0,240,255,0.25)]">
            <div className="flex items-center justify-between border-b border-[#00f0ff]/20 pb-2">
              <h3 className="font-['Orbitron',sans-serif] font-bold text-sm text-[#00f0ff]">
                ĐĂNG KÝ DỰ ÁN VÀO DANH MỤC CHO PHÉP
              </h3>
              <button onClick={() => setShowAddProject(false)} className="text-white/40 hover:text-white">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="bg-[#ff3344]/20 border border-[#ff3344] text-[#ff3344] text-xs p-2 rounded">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleRegisterProject} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">TÊN DỰ ÁN</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ví dụ: GreenPhone hoặc CertMaster..."
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>

              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">ĐƯỜNG DẪN THƯ MỤC CỤC BỘ</label>
                <input
                  type="text"
                  required
                  value={newProjectPath}
                  onChange={(e) => setNewProjectPath(e.target.value)}
                  placeholder="Ví dụ: D:\IT\GreenPhone hoặc C:\Projects\CertMaster"
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white font-mono focus:outline-none focus:border-[#00f0ff]"
                />
                <span className="text-[10px] text-white/40 mt-0.5 block">
                  Đường dẫn sẽ được chuẩn hóa tuyệt đối để bảo vệ chống tấn công Path Traversal.
                </span>
              </div>

              <div>
                <label className="block text-[#00f0ff]/80 font-bold mb-1">LOẠI DỰ ÁN</label>
                <select
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value)}
                  className="w-full bg-[#020813] border border-[#00f0ff]/30 rounded p-2 text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="spring_boot">Spring Boot (Java)</option>
                  <option value="react_typescript">React TypeScript</option>
                  <option value="python_extension">Python / Browser Extension</option>
                  <option value="other">Dự án khác</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-[#00f0ff]/20">
                <button
                  type="button"
                  onClick={() => setShowAddProject(false)}
                  className="px-3 py-1.5 rounded text-white/60 hover:text-white"
                >
                  Hủy
                </button>
                <NeonButton size="sm" type="submit">
                  LIÊN KẾT DỰ ÁN
                </NeonButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
