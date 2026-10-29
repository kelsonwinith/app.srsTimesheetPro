import { Customer, LeaveType, LockConfig, Project, TaskType, TimesheetEntry, UserProfile } from "@/types/timesheet";

export const DEFAULT_USER: UserProfile = {
  id: "",
  employeeId: 0,
  displayName: "",
  givenName: "",
  jobTitle: "",
  mail: "",
  department: "",
  role: "Employee",
  menu: ["timesheet"],
  reportTo: "",
  avatarUrl: "",
};

export const MOCK_USERS: UserProfile[] = [];

export const MOCK_LEAVE_TYPES: LeaveType[] = [];

export const MOCK_TASK_TYPES: TaskType[] = [];

export const MOCK_CUSTOMERS: Customer[] = [];

export const MOCK_PROJECTS: Project[] = [];

export const MOCK_LOCK_CONFIG: LockConfig = {
  unlock_timesheet_date: "",
  updated_at: "",
  updated_by: "",
};

export const MOCK_TIMESHEETS: TimesheetEntry[] = [];
