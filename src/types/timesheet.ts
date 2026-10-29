export type TimesheetStatus = "Waiting" | "Approve" | "Reject";

export type LeaveOption = 0 | 1 | 2; // 0 = No Leave, 1 = Half Day (4h), 2 = Full Day (8h)

export interface TimesheetEntry {
  timesheet_id: string;
  date: string; // YYYY-MM-DD
  start_time: string; // HH:mm
  finish_time: string; // HH:mm
  man_hour: number;
  project_id: number;
  project_name: string;
  project_code: string;
  task: string;
  task_id: number;
  tag: boolean;
  tag_id?: number;
  tag_name?: string;
  element_id?: number;
  detail: string;
  leave: LeaveOption;
  leave_type_id?: number;
  leave_type_name?: string;
  timesheet_status: TimesheetStatus;
  reject_reason?: string;
  employee_id: number;
  employee_name: string;
  department: string;
  approved_by?: string;
  approved_at?: string;
  created_at: string;
}

export interface ProjectTag {
  tag_timesheet_id: number;
  tag_name: string;
  tag_element_ts: string;
}

export interface TaskType {
  task_id: number;
  task_name: string;
}

export type SaleStatus = "Presales" | "WIN" | "Lose";
export type ProjectStatus = "Presales" | "Implement" | "Warranty" | "Maintenance" | "Closed";

export interface Project {
  project_id: number;
  project_name: string;
  project_code: string;
  customer_id: number;
  customer_name: string;
  sale_status: SaleStatus;
  project_status: ProjectStatus;
  manager_name: string;
  allocated_mandays: number;
  used_mandays: number;
  tags: ProjectTag[];
  tasks: TaskType[];
  description?: string;
}

export interface Customer {
  customer_id: number;
  customer_name: string;
  customer_code: string;
  contact_person: string;
  email: string;
  phone: string;
  active_projects_count: number;
}

export interface LeaveType {
  leave_id: number;
  leave_name: string;
  leave_code: string;
  description: string;
  max_days_per_year: number;
}

export interface UserProfile {
  id: string;
  employeeId: number;
  displayName: string;
  givenName: string;
  jobTitle: string;
  mail: string;
  department: string;
  team?: string;
  role: "Employee" | "Manager" | "Admin";
  menu: string[];
  reportTo?: string;
  avatarUrl?: string;
}

export interface LockConfig {
  unlock_timesheet_date: string; // YYYY-MM-DD
  updated_at: string;
  updated_by: string;
}

export interface MonthSummary {
  totalHours: number;
  approvedHours: number;
  waitingHours: number;
  rejectedHours: number;
  workingDays: number;
  leaveDays: number;
}
