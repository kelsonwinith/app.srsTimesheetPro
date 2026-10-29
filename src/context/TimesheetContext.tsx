"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Customer,
  LeaveType,
  LockConfig,
  MonthSummary,
  Project,
  TimesheetEntry,
  UserProfile,
} from "@/types/timesheet";
import {
  DEFAULT_USER,
  MOCK_CUSTOMERS,
  MOCK_LEAVE_TYPES,
  MOCK_LOCK_CONFIG,
  MOCK_PROJECTS,
  MOCK_TIMESHEETS,
  MOCK_USERS,
} from "@/data/mockData";
import {
  getAuditLogs,
  getStoredApiCredentials,
  saveStoredApiCredentials,
  getStoredUserProfile,
  saveStoredUserProfile,
  safeFetchBackend,
  SafetyAuditLog,
} from "@/services/apiSafetyClient";
import * as XLSX from "xlsx";

interface TimesheetContextType {
  currentUser: UserProfile;
  setCurrentUser: (user: UserProfile) => void;
  users: UserProfile[];
  timesheets: TimesheetEntry[];
  projects: Project[];
  customers: Customer[];
  leaveTypes: LeaveType[];
  lockConfig: LockConfig;
  auditLogs: SafetyAuditLog[];
  refreshAuditLogs: () => void;
  
  // Real API state & controls
  isRealApiConnected: boolean;
  apiToken: string;
  apiEmployeeId: string;
  isSyncingApi: boolean;
  apiSyncError: string | null;
  setApiCredentials: (token: string, employeeId: string) => Promise<boolean>;
  syncWithRealApi: (targetDate?: string) => Promise<boolean>;
  fetchRealTagsForProject: (projectId: number) => Promise<{ tag_timesheet_id: number; tag_name: string; tag_element_ts: string }[]>;
  addCustomProject: (project: Project) => void;

  // Time Entry CRUD
  addTimesheet: (
    entry: Omit<TimesheetEntry, "timesheet_id" | "created_at" | "timesheet_status" | "employee_id" | "employee_name" | "department">,
    isAllDaySplit?: boolean
  ) => { success: boolean; error?: string };
  updateTimesheet: (
    id: string,
    updates: Partial<TimesheetEntry>
  ) => { success: boolean; error?: string };
  deleteTimesheet: (id: string) => { success: boolean; error?: string };
  approveTimesheets: (ids: string[]) => void;
  rejectTimesheets: (ids: string[], reason: string) => void;
  updateLockDate: (newDate: string) => void;
  resetAllData: () => void;
  exportToExcel: (customEntries?: TimesheetEntry[], filename?: string) => void;
  exportToCSV: (customEntries?: TimesheetEntry[], filename?: string) => void;
  calculateMonthSummary: (yearMonth: string, employeeId?: number) => MonthSummary;
}

const TimesheetContext = createContext<TimesheetContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CURRENT_USER: "sirisoft_current_user",
  TIMESHEETS: "sirisoft_timesheets",
  PROJECTS: "sirisoft_projects",
  LOCK_CONFIG: "sirisoft_lock_config",
};

export const TimesheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUserState] = useState<UserProfile>(DEFAULT_USER);
  const [timesheets, setTimesheets] = useState<TimesheetEntry[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [lockConfig, setLockConfig] = useState<LockConfig>(MOCK_LOCK_CONFIG);
  const [auditLogs, setAuditLogs] = useState<SafetyAuditLog[]>([]);

  // API credentials & connection state
  const [apiToken, setApiToken] = useState("");
  const [apiEmployeeId, setApiEmployeeId] = useState("");
  const [isRealApiConnected, setIsRealApiConnected] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  const [apiSyncError, setApiSyncError] = useState<string | null>(null);

  // Sync with real backend using GET methods only
  const syncWithRealApi = useCallback(async (targetDate?: string) => {
    setIsSyncingApi(true);
    setApiSyncError(null);

    const dateToQuery = targetDate || new Date().toISOString().split("T")[0];

    try {
      // 1. Fetch real projects via GET
      const projRes = await safeFetchBackend<any[]>(
        `/timesheet-service/projects/name?date=${dateToQuery}`,
        { method: "GET" }
      );

      // 2. Fetch real leave types via GET
      const leaveRes = await safeFetchBackend<any[]>(
        "/timesheet-service/leave",
        { method: "GET" }
      );

      // 3. Fetch real lock config via GET
      const lockRes = await safeFetchBackend<any>(
        "/timesheet-service/config/timesheet",
        { method: "GET" }
      );

      if (!projRes.success && projRes.status === 401) {
        setIsRealApiConnected(false);
        setApiSyncError("Unauthorized (401): Please provide a valid Azure AD Bearer Token.");
        setIsSyncingApi(false);
        return false;
      }

      if (projRes.success && Array.isArray(projRes.data)) {
        const mappedProjects: Project[] = projRes.data.map((item: any, idx: number) => ({
          project_id: item.project_id || item.id || idx + 1,
          project_name: item.project_name || item.name || "Project",
          project_code: item.project_code || item.code || `PRJ-${idx + 1}`,
          customer_id: item.customer_id || 0,
          customer_name: item.customer_name || "Client",
          sale_status: item.sale_status || "WIN",
          project_status: item.project_status || "Implement",
          manager_name: item.manager_name || "Manager",
          allocated_mandays: item.allocated_mandays || 0,
          used_mandays: item.used_mandays || 0,
          tags: Array.isArray(item.tags)
            ? item.tags.map((tg: any, tIdx: number) => ({
                tag_timesheet_id: tg.tag_timesheet_id || tIdx + 1,
                tag_name: tg.tag_name || `Tag ${tIdx + 1}`,
                tag_element_ts: tg.tag_element_ts || `TAG-${tIdx + 1}`,
              }))
            : [],
          tasks: [
            { task_id: 1, task_name: "Development (Frontend/Backend)" },
            { task_id: 2, task_name: "Meeting & Coordination" },
            { task_id: 3, task_name: "Requirement Analysis & Design" },
            { task_id: 4, task_name: "Testing, QA & Test Automation" },
            { task_id: 5, task_name: "Bug Fixing & Incident Resolution" },
            { task_id: 6, task_name: "Code Review & Technical Spike" },
            { task_id: 7, task_name: "DevOps, CI/CD & Deployment" },
            { task_id: 8, task_name: "Documentation & Knowledge Transfer" },
          ],
          description: item.description || "",
        }));

        setProjects(mappedProjects);
        setIsRealApiConnected(true);
      }

      if (leaveRes.success && Array.isArray(leaveRes.data)) {
        const mappedLeaves: LeaveType[] = leaveRes.data.map((l: any, idx: number) => ({
          leave_id: l.leave_id || l.id || idx + 1,
          leave_name: l.leave_name || l.name || "Leave",
          leave_code: l.leave_code || `L-${idx + 1}`,
          description: l.description || "",
          max_days_per_year: l.max_days || 15,
        }));
        setLeaveTypes(mappedLeaves);
      }

      if (lockRes.success && lockRes.data) {
        setLockConfig({
          unlock_timesheet_date: lockRes.data.unlock_timesheet_date || "",
          updated_at: lockRes.data.updated_at || new Date().toISOString(),
          updated_by: lockRes.data.updated_by || "System",
        });
      }

      // Fetch real timesheets if employee ID is available
      const creds = getStoredApiCredentials();
      if (creds.employeeId) {
        const tsRes = await safeFetchBackend<any[]>(
          `/timesheet-service/time-sheet`,
          { method: "GET" }
        );
        if (tsRes.success && Array.isArray(tsRes.data)) {
          setTimesheets(tsRes.data);
        }
      }

      setIsSyncingApi(false);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sync error";
      setApiSyncError(msg);
      setIsSyncingApi(false);
      return false;
    }
  }, []);

  const fetchRealTagsForProject = async (projectId: number) => {
    const creds = getStoredApiCredentials();
    const empId = creds.employeeId || currentUser.employeeId;
    if (empId) {
      try {
        const res = await safeFetchBackend<any[]>(
          `/timesheet-service/time-sheet/gettag?empId=${empId}&project_id=${projectId}`,
          { method: "GET" }
        );
        if (res.success && Array.isArray(res.data)) {
          return res.data.map((tg: any, i: number) => ({
            tag_timesheet_id: tg.tag_timesheet_id || tg.id || i + 1,
            tag_name: tg.tag_name || tg.name || `Tag ${i + 1}`,
            tag_element_ts: tg.tag_element_ts || tg.element_id || `TAG-${i + 1}`,
          }));
        }
      } catch (e) {
        console.warn("Failed to fetch real tags", e);
      }
    }
    const current = projects.find((p) => p.project_id === projectId);
    return current?.tags || [];
  };

  function decodeJwtPayload(token: string): any {
    try {
      const parts = token.split(".");
      if (parts.length < 2) return null;
      let base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
      while (base64.length % 4) {
        base64 += "=";
      }
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const text = new TextDecoder().decode(bytes);
      return JSON.parse(text);
    } catch (e) {
      console.warn("Could not decode JWT payload", e);
      return null;
    }
  }

  const populateUserFromToken = (tok: string, empId?: string, profileObj?: any) => {
    try {
      if (profileObj && typeof profileObj === "object") {
        const extractedEmpId =
          empId ||
          profileObj.employeeId ||
          profileObj.empId ||
          profileObj.id ||
          profileObj.employee_id ||
          0;
        const displayName =
          profileObj.displayName ||
          profileObj.name ||
          (profileObj.givenName ? `${profileObj.givenName} ${profileObj.surname || ""}`.trim() : "") ||
          "";
        const email = profileObj.mail || profileObj.email || profileObj.userPrincipalName || "";
        const givenName = profileObj.givenName || (displayName ? displayName.split(" ")[0] : "");
        const department = profileObj.department || profileObj.division || "";
        const jobTitle = profileObj.jobTitle || profileObj.position || profileObj.title || "";
        const reportTo =
          profileObj.reportTo ||
          profileObj.report_to ||
          profileObj.manager ||
          profileObj.managerName ||
          profileObj.supervisor ||
          "";
        const avatarUrl =
          profileObj.avatarUrl ||
          profileObj.photo ||
          profileObj.image ||
          profileObj.picture ||
          "/assets/images/profile.svg";

        const updated: UserProfile = {
          id: String(extractedEmpId || "user-current"),
          employeeId: extractedEmpId ? Number(extractedEmpId) || 0 : 0,
          displayName,
          givenName,
          jobTitle,
          mail: email,
          department,
          role: "Employee",
          menu: ["timesheet", "approval", "projectManagement", "report", "setting"],
          reportTo,
          avatarUrl,
        };

        setCurrentUserState(updated);
        saveStoredUserProfile(updated);
        return;
      }

      if (tok) {
        const payload = decodeJwtPayload(tok);
        if (payload) {
          const displayName = payload.name || payload.preferred_username || "";
          const email = payload.preferred_username || payload.email || payload.upn || "";
          const givenName = payload.given_name || (displayName ? displayName.split(" ")[0] : "");
          const extractedEmpId = empId || payload.employeeId || payload.empId || 0;

          setCurrentUserState((prev) => {
            const next: UserProfile = {
              ...prev,
              displayName: displayName || prev.displayName,
              mail: email || prev.mail,
              givenName: givenName || prev.givenName,
              employeeId: extractedEmpId ? Number(extractedEmpId) || prev.employeeId : prev.employeeId,
              avatarUrl: prev.avatarUrl || "/assets/images/profile.svg",
            };
            saveStoredUserProfile(next);
            return next;
          });
        }
      }
    } catch (e) {
      console.warn("populateUser error", e);
    }
  };

  const setApiCredentials = async (token: string, employeeId: string) => {
    setApiToken(token);
    setApiEmployeeId(employeeId);
    saveStoredApiCredentials(token, employeeId);
    if (employeeId) {
      setCurrentUserState((prev) => ({
        ...prev,
        employeeId: Number(employeeId) || prev.employeeId,
      }));
    }
    if (token) {
      populateUserFromToken(token, employeeId);
    }
    return await syncWithRealApi();
  };

  const addCustomProject = (proj: Project) => {
    setProjects((prev) => [...prev, proj]);
  };

  // Clean initialization: purge any leftover mock data from previous sessions
  useEffect(() => {
    setIsClient(true);
    try {
      // 1. Check for incoming automated auth via URL Hash (safest, no server logs) or Query Params
      let autoToken = "";
      let autoEmpId = "";
      let autoProfile: any = null;

      if (typeof window !== "undefined") {
        if (window.location.hash && window.location.hash.length > 1) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          autoToken = hashParams.get("token") || "";
          autoEmpId = hashParams.get("empId") || "";
          const rawProfile = hashParams.get("profile");
          if (rawProfile) {
            try {
              autoProfile = JSON.parse(rawProfile);
            } catch (e) {}
          }
        }

        if (!autoToken && window.location.search) {
          const searchParams = new URLSearchParams(window.location.search);
          autoToken = searchParams.get("token") || "";
          autoEmpId = searchParams.get("empId") || "";
          const rawProfile = searchParams.get("profile");
          if (rawProfile) {
            try {
              autoProfile = JSON.parse(rawProfile);
            } catch (e) {}
          }
        }
      }

      if (autoToken || autoProfile) {
        if (autoToken) {
          saveStoredApiCredentials(autoToken, autoEmpId);
          setApiToken(autoToken);
        }
        if (autoEmpId) {
          setApiEmployeeId(autoEmpId);
        }

        populateUserFromToken(autoToken, autoEmpId, autoProfile);
        window.history.replaceState({}, document.title, window.location.pathname);

        toast.success("Sync Timesheet session connected!", {
          description: autoProfile?.displayName
            ? `Welcome, ${autoProfile.displayName} (Employee #${autoEmpId || autoProfile.employeeId})`
            : "Session imported successfully",
        });

        if (autoToken) {
          syncWithRealApi();
        }
      } else {
        const storedProfile = getStoredUserProfile();
        if (storedProfile && storedProfile.employeeId && storedProfile.employeeId !== 0) {
          setCurrentUserState(storedProfile);
        } else {
          setCurrentUserState(DEFAULT_USER);
        }

        const creds = getStoredApiCredentials();
        if (creds.token) {
          setApiToken(creds.token);
          if (!storedProfile) {
            populateUserFromToken(creds.token, creds.employeeId);
          }
        }
        if (creds.employeeId) {
          setApiEmployeeId(creds.employeeId);
          setCurrentUserState((prev) => ({
            ...prev,
            employeeId: Number(creds.employeeId) || prev.employeeId,
          }));
        }
        // If credentials exist, sync real API
        if (creds.token) {
          syncWithRealApi();
        }
      }

      // Check stored timesheets; if they contain old mock items (ts-101, etc.), clear them!
      const storedTimesheets = localStorage.getItem(STORAGE_KEYS.TIMESHEETS);
      if (storedTimesheets) {
        const parsed: TimesheetEntry[] = JSON.parse(storedTimesheets);
        const hasMockData = parsed.some((t) => t.timesheet_id.startsWith("ts-10") || t.timesheet_id.startsWith("ts-20"));
        if (hasMockData) {
          localStorage.removeItem(STORAGE_KEYS.TIMESHEETS);
          setTimesheets([]);
        } else {
          setTimesheets(parsed);
        }
      } else {
        setTimesheets([]);
      }

      // Check stored projects; clear if mock
      const storedProjects = localStorage.getItem(STORAGE_KEYS.PROJECTS);
      if (storedProjects) {
        const parsed: Project[] = JSON.parse(storedProjects);
        const hasMockProjects = parsed.some((p) => p.project_code === "SCB-MOD-2026" || p.project_code === "SRS-TS-NEXT");
        if (hasMockProjects) {
          localStorage.removeItem(STORAGE_KEYS.PROJECTS);
          setProjects([]);
        } else {
          setProjects(parsed);
        }
      } else {
        setProjects([]);
      }

      setAuditLogs(getAuditLogs());
    } catch (e) {
      console.error("Failed to load stored state", e);
    }
  }, [syncWithRealApi]);

  // Sync user timesheets to localStorage
  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TIMESHEETS, JSON.stringify(timesheets));
    } catch (e) {
      console.error("Failed to persist timesheets", e);
    }
  }, [timesheets, isClient]);

  const setCurrentUser = (user: UserProfile) => {
    setCurrentUserState(user);
    try {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } catch (e) {
      console.error("Failed to save current user", e);
    }
  };

  const refreshAuditLogs = () => {
    setAuditLogs(getAuditLogs());
  };

  const addTimesheet = (
    entry: Omit<TimesheetEntry, "timesheet_id" | "created_at" | "timesheet_status" | "employee_id" | "employee_name" | "department">,
    isAllDaySplit: boolean = false
  ) => {
    if (lockConfig.unlock_timesheet_date && entry.date < lockConfig.unlock_timesheet_date) {
      return {
        success: false,
        error: `Timesheet date is locked prior to ${lockConfig.unlock_timesheet_date}.`,
      };
    }

    const timestamp = new Date().toISOString();

    if (isAllDaySplit && entry.leave === 0) {
      const firstHalf: TimesheetEntry = {
        ...entry,
        timesheet_id: `ts-${Date.now()}-1`,
        start_time: "09:00",
        finish_time: "12:00",
        man_hour: 3.0,
        timesheet_status: "Waiting",
        employee_id: currentUser.employeeId,
        employee_name: currentUser.displayName,
        department: currentUser.department,
        created_at: timestamp,
      };

      const secondHalf: TimesheetEntry = {
        ...entry,
        timesheet_id: `ts-${Date.now()}-2`,
        start_time: "13:00",
        finish_time: "18:00",
        man_hour: 5.0,
        timesheet_status: "Waiting",
        employee_id: currentUser.employeeId,
        employee_name: currentUser.displayName,
        department: currentUser.department,
        created_at: timestamp,
      };

      setTimesheets((prev) => [firstHalf, secondHalf, ...prev]);
      return { success: true };
    }

    const newEntry: TimesheetEntry = {
      ...entry,
      timesheet_id: `ts-${Date.now()}`,
      timesheet_status: "Waiting",
      employee_id: currentUser.employeeId,
      employee_name: currentUser.displayName,
      department: currentUser.department,
      created_at: timestamp,
    };

    setTimesheets((prev) => [newEntry, ...prev]);
    return { success: true };
  };

  const updateTimesheet = (id: string, updates: Partial<TimesheetEntry>) => {
    const existing = timesheets.find((t) => t.timesheet_id === id);
    if (!existing) {
      return { success: false, error: "Timesheet entry not found" };
    }

    if (updates.date && lockConfig.unlock_timesheet_date && updates.date < lockConfig.unlock_timesheet_date) {
      return {
        success: false,
        error: `Cannot update entry prior to locked cutoff date (${lockConfig.unlock_timesheet_date}).`,
      };
    }

    setTimesheets((prev) =>
      prev.map((t) => (t.timesheet_id === id ? { ...t, ...updates, timesheet_status: "Waiting" } : t))
    );
    return { success: true };
  };

  const deleteTimesheet = (id: string) => {
    setTimesheets((prev) => prev.filter((t) => t.timesheet_id !== id));
    return { success: true };
  };

  const approveTimesheets = (ids: string[]) => {
    const now = new Date().toISOString();
    setTimesheets((prev) =>
      prev.map((t) =>
        ids.includes(t.timesheet_id)
          ? {
              ...t,
              timesheet_status: "Approve",
              approved_by: currentUser.displayName,
              approved_at: now,
              reject_reason: undefined,
            }
          : t
      )
    );
  };

  const rejectTimesheets = (ids: string[], reason: string) => {
    const now = new Date().toISOString();
    setTimesheets((prev) =>
      prev.map((t) =>
        ids.includes(t.timesheet_id)
          ? {
              ...t,
              timesheet_status: "Reject",
              approved_by: currentUser.displayName,
              approved_at: now,
              reject_reason: reason,
            }
          : t
      )
    );
  };

  const updateLockDate = (newDate: string) => {
    const updated: LockConfig = {
      unlock_timesheet_date: newDate,
      updated_at: new Date().toISOString(),
      updated_by: currentUser.displayName,
    };
    setLockConfig(updated);
  };

  const resetAllData = () => {
    setTimesheets([]);
    setProjects([]);
    setCustomers([]);
    setLeaveTypes([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.TIMESHEETS);
      localStorage.removeItem(STORAGE_KEYS.PROJECTS);
      localStorage.removeItem(STORAGE_KEYS.LOCK_CONFIG);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } catch (e) {
      console.error(e);
    }
  };

  const calculateMonthSummary = (yearMonth: string, employeeId?: number): MonthSummary => {
    const relevant = timesheets.filter((t) => {
      const matchMonth = t.date.startsWith(yearMonth);
      const matchEmp = employeeId ? t.employee_id === employeeId : true;
      return matchMonth && matchEmp;
    });

    let totalHours = 0;
    let approvedHours = 0;
    let waitingHours = 0;
    let rejectedHours = 0;
    let leaveDays = 0;

    const uniqueDates = new Set<string>();

    relevant.forEach((t) => {
      if (t.timesheet_status !== "Reject") {
        totalHours += t.man_hour;
        uniqueDates.add(t.date);
      }

      if (t.timesheet_status === "Approve") {
        approvedHours += t.man_hour;
      } else if (t.timesheet_status === "Waiting") {
        waitingHours += t.man_hour;
      } else if (t.timesheet_status === "Reject") {
        rejectedHours += t.man_hour;
      }

      if (t.leave === 2) {
        leaveDays += 1;
      } else if (t.leave === 1) {
        leaveDays += 0.5;
      }
    });

    return {
      totalHours,
      approvedHours,
      waitingHours,
      rejectedHours,
      workingDays: uniqueDates.size,
      leaveDays,
    };
  };

  const exportToExcel = (customEntries?: TimesheetEntry[], filename = "Sirisoft_Timesheet_Export.xlsx") => {
    const list = customEntries || timesheets;
    const rows = list.map((item, idx) => ({
      No: idx + 1,
      Date: item.date,
      "Employee ID": item.employee_id,
      "Employee Name": item.employee_name,
      Department: item.department,
      "Start Time": item.start_time,
      "Finish Time": item.finish_time,
      "Hours Worked": item.man_hour,
      "Project Code": item.project_code,
      "Project Name": item.project_name,
      Task: item.task,
      Tag: item.tag_name || "-",
      Detail: item.detail,
      Leave: item.leave === 2 ? "Full Day" : item.leave === 1 ? "Half Day" : "None",
      "Leave Type": item.leave_type_name || "-",
      Status: item.timesheet_status,
      "Approver / Rejector": item.approved_by || "-",
      "Rejection Reason": item.reject_reason || "-",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheets");
    XLSX.writeFile(workbook, filename);
  };

  const exportToCSV = (customEntries?: TimesheetEntry[], filename = "Sirisoft_Timesheet_Export.csv") => {
    const list = customEntries || timesheets;
    const rows = list.map((item) => [
      item.date,
      item.employee_name,
      item.start_time,
      item.finish_time,
      item.man_hour,
      `"${item.project_name.replace(/"/g, '""')}"`,
      `"${item.task.replace(/"/g, '""')}"`,
      `"${(item.tag_name || "").replace(/"/g, '""')}"`,
      `"${(item.detail || "").replace(/"/g, '""')}"`,
      item.timesheet_status,
    ]);

    const header = ["Date", "Employee", "Start", "Finish", "Hours", "Project", "Task", "Tag", "Detail", "Status"];
    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [header.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <TimesheetContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users: [currentUser],
        timesheets,
        projects,
        customers,
        leaveTypes,
        lockConfig,
        auditLogs,
        refreshAuditLogs,
        isRealApiConnected,
        apiToken,
        apiEmployeeId,
        isSyncingApi,
        apiSyncError,
        setApiCredentials,
        syncWithRealApi,
        fetchRealTagsForProject,
        addCustomProject,
        addTimesheet,
        updateTimesheet,
        deleteTimesheet,
        approveTimesheets,
        rejectTimesheets,
        updateLockDate,
        resetAllData,
        exportToExcel,
        exportToCSV,
        calculateMonthSummary,
      }}
    >
      {children}
    </TimesheetContext.Provider>
  );
};

export const useTimesheet = () => {
  const context = useContext(TimesheetContext);
  if (!context) {
    throw new Error("useTimesheet must be used within a TimesheetProvider");
  }
  return context;
};
