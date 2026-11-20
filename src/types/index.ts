export type RobotState =
  | "IDLE"
  | "LISTENING"
  | "THINKING"
  | "SPEAKING"
  | "PROCESSING"
  | "SUCCESS"
  | "ERROR";

export interface HardwareMetric {
  cpu_percent: number;
  memory_percent: number;
  memory_used_mb: number;
  memory_total_mb: number;
  disk_percent: number;
  disk_free_gb: number;
  gpu_name: string | null;
  gpu_percent: number | null;
  network_sent_kb: number;
  network_recv_kb: number;
  os_name: string;
  os_version: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  agent_name?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceCategory {
  id: string;
  name: string;
  category_type: "income" | "expense";
  icon: string;
  color: string;
}

export interface FinanceAccount {
  id: string;
  name: string;
  account_type: string;
  currency: string;
  initial_balance: number;
  current_balance: number;
  is_active: boolean;
}

export interface FinanceTransaction {
  id: string;
  account_id: string;
  account_name: string;
  category_id: string;
  category_name: string;
  category_color: string;
  amount: number; // in VND minor units
  currency: string;
  transaction_type: "income" | "expense" | "transfer";
  transaction_date: string;
  payee: string;
  notes?: string;
  fingerprint?: string;
}

export interface FinanceSummary {
  month: number;
  year: number;
  currency: string;
  total_income: number;
  total_expense: number;
  net_savings: number;
  category_distribution: { name: string; color: string; amount: number }[];
  budget_status: {
    category_name: string;
    budget_amount: number;
    spent_amount: number;
    percentage: number;
    is_exceeded: boolean;
    is_warning: boolean;
  }[];
}

export interface RegisteredProject {
  id: string;
  name: string;
  project_type: string;
  description: string;
  created_at: string;
  repositories: {
    id: string;
    local_path: string;
    default_branch: string;
    remote_url?: string;
    is_allowlisted: boolean;
  }[];
}

export interface GitStatus {
  is_git: boolean;
  current_branch: string;
  is_clean: boolean;
  staged_files: string[];
  unstaged_files: string[];
  untracked_files: string[];
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  status: "TODO" | "IN_PROGRESS" | "DONE" | "CANCELLED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  due_date?: string;
  project_id?: string;
  project_name?: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  category: "SYSTEM" | "FINANCE" | "TASK" | "GMAIL" | "SECURITY";
  priority: "INFO" | "WARNING" | "CRITICAL";
  is_read: boolean;
  created_at: string;
}
