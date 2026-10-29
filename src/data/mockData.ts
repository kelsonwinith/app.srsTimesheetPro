import { Customer, LeaveType, LockConfig, Project, TaskType, TimesheetEntry, UserProfile } from "@/types/timesheet";

export const DEFAULT_USER: UserProfile = {
  id: "663",
  employeeId: 663,
  displayName: "Sinthon Wilke",
  givenName: "Sinthon",
  jobTitle: "Software Developer",
  mail: "sinthon.w@sirisoft.co.th",
  department: "Software Development",
  role: "Employee",
  menu: ["timesheet", "approval", "projectManagement", "report", "setting"],
  reportTo: "Pongsiri Kamkongkaew",
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
