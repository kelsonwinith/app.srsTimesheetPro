import { Customer, LeaveType, LockConfig, Project, TaskType, TimesheetEntry, UserProfile } from "@/types/timesheet";

export const DEFAULT_USER: UserProfile = {
  id: "user-current",
  employeeId: 0,
  displayName: "Timesheet User",
  givenName: "User",
  jobTitle: "Team Member",
  mail: "user@sirisoft.co.th",
  department: "Application Development",
  role: "Employee",
  menu: ["timesheet", "approval", "projectManagement", "report", "setting"],
};

export const MOCK_USERS: UserProfile[] = [DEFAULT_USER];

export const MOCK_LEAVE_TYPES: LeaveType[] = [];

export const MOCK_TASK_TYPES: TaskType[] = [
  { task_id: 1, task_name: "Development (Frontend/Backend)" },
  { task_id: 2, task_name: "Requirement Analysis & Design" },
  { task_id: 3, task_name: "Testing, QA & Test Automation" },
  { task_id: 4, task_name: "Bug Fixing & Incident Resolution" },
  { task_id: 5, task_name: "Sprint Planning & Standup Meeting" },
  { task_id: 6, task_name: "Code Review & Technical Spike" },
  { task_id: 7, task_name: "DevOps, CI/CD & Deployment" },
  { task_id: 8, task_name: "Documentation & Knowledge Transfer" },
];

export const MOCK_CUSTOMERS: Customer[] = [];

export const MOCK_PROJECTS: Project[] = [];

export const MOCK_LOCK_CONFIG: LockConfig = {
  unlock_timesheet_date: "",
  updated_at: "",
  updated_by: "",
};

export const MOCK_TIMESHEETS: TimesheetEntry[] = [];
