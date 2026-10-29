"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useTimesheet } from "@/context/TimesheetContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart3,
  AlertTriangle,
  Briefcase,
  Users,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
} from "lucide-react";
import * as XLSX from "xlsx";

export const ReportView: React.FC = () => {
  const { timesheets, projects, users, exportToExcel } = useTimesheet();
  const [reportTab, setReportTab] = useState<"incomplete" | "projects" | "employees">("incomplete");

  // Incomplete Timesheet Analysis
  // Group timesheets by employee + date
  const incompleteReports = useMemo(() => {
    const map = new Map<string, { employee_name: string; employee_id: number; department: string; date: string; totalHours: number; entriesCount: number }>();

    timesheets.forEach((t) => {
      if (t.timesheet_status === "Reject") return;
      const key = `${t.employee_id}_${t.date}`;
      const existing = map.get(key) || {
        employee_name: t.employee_name,
        employee_id: t.employee_id,
        department: t.department,
        date: t.date,
        totalHours: 0,
        entriesCount: 0,
      };
      existing.totalHours += t.man_hour;
      existing.entriesCount += 1;
      map.set(key, existing);
    });

    // Incomplete days are those with total hours > 0 but < 8.0
    return Array.from(map.values())
      .filter((rec) => rec.totalHours < 8.0)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [timesheets]);

  // Project Resource Breakdown
  const projectReports = useMemo(() => {
    return projects.map((p) => {
      const pEntries = timesheets.filter(
        (t) => t.project_id === p.project_id && t.timesheet_status !== "Reject"
      );

      const totalHours = pEntries.reduce((sum, e) => sum + e.man_hour, 0);
      const totalMandays = Math.round((totalHours / 8) * 10) / 10;

      // Group by task type
      const taskBreakdown: Record<string, number> = {};
      pEntries.forEach((e) => {
        taskBreakdown[e.task] = (taskBreakdown[e.task] || 0) + e.man_hour;
      });

      return {
        project_id: p.project_id,
        project_name: p.project_name,
        project_code: p.project_code,
        customer_name: p.customer_name,
        allocated_mandays: p.allocated_mandays,
        used_mandays: totalMandays,
        totalHours,
        taskBreakdown,
        contributorsCount: new Set(pEntries.map((e) => e.employee_id)).size,
      };
    });
  }, [projects, timesheets]);

  // Employee Summary Breakdown
  const employeeReports = useMemo(() => {
    // Unique employees from users + timesheets
    const empMap = new Map<number, { id: number; name: string; department: string; totalHours: number; approvedHours: number; waitingHours: number; leaveDays: number }>();

    timesheets.forEach((t) => {
      const existing = empMap.get(t.employee_id) || {
        id: t.employee_id,
        name: t.employee_name,
        department: t.department,
        totalHours: 0,
        approvedHours: 0,
        waitingHours: 0,
        leaveDays: 0,
      };

      if (t.timesheet_status !== "Reject") {
        existing.totalHours += t.man_hour;
      }
      if (t.timesheet_status === "Approve") {
        existing.approvedHours += t.man_hour;
      } else if (t.timesheet_status === "Waiting") {
        existing.waitingHours += t.man_hour;
      }
      if (t.leave === 2) {
        existing.leaveDays += 1;
      } else if (t.leave === 1) {
        existing.leaveDays += 0.5;
      }

      empMap.set(t.employee_id, existing);
    });

    return Array.from(empMap.values());
  }, [timesheets]);

  const handleExportIncomplete = () => {
    const rows = incompleteReports.map((r, i) => ({
      No: i + 1,
      Date: r.date,
      "Employee ID": r.employee_id,
      "Employee Name": r.employee_name,
      Department: r.department,
      "Logged Hours": r.totalHours,
      "Missing Hours": (8.0 - r.totalHours).toFixed(2),
      Status: "Incomplete (< 8 hours)",
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Incomplete Timesheet");
    XLSX.writeFile(workbook, "Sirisoft_Incomplete_Timesheets.xlsx");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <BarChart3 className="size-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Reports & Manday Analytics
            </h1>
            <p className="text-xs text-slate-500">
              Audit incomplete timesheets, resource utilization, and team capacity.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setReportTab("incomplete")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              reportTab === "incomplete"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <AlertTriangle className="size-3.5 text-amber-500" />
            <span>Incomplete Timesheet ({incompleteReports.length})</span>
          </button>
          <button
            onClick={() => setReportTab("projects")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              reportTab === "projects"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Briefcase className="size-3.5" />
            <span>Project Resource</span>
          </button>
          <button
            onClick={() => setReportTab("employees")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              reportTab === "employees"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Users className="size-3.5" />
            <span>Employee Summary</span>
          </button>
        </div>
      </div>

      {reportTab === "incomplete" && (
        /* Incomplete Timesheets Tab */
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50/50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
            <div>
              <h3 className="text-xs font-bold text-amber-900 dark:text-amber-200 flex items-center gap-2">
                <AlertTriangle className="size-4 text-amber-600" />
                Missing / Incomplete Manday Days Detected
              </h3>
              <p className="text-[11px] text-amber-800/80 dark:text-amber-300 mt-0.5">
                Standard policy expects at least 8.0 hours of recorded project work or approved leave per working day.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportIncomplete}
              className="h-8 gap-1.5 border-amber-300 text-amber-900 hover:bg-amber-100 dark:text-amber-200 text-xs font-semibold"
            >
              <FileSpreadsheet className="size-3.5" />
              Export Incomplete List
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                  <TableHead className="w-28 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Date
                  </TableHead>
                  <TableHead className="w-44 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Employee
                  </TableHead>
                  <TableHead className="w-40 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Department
                  </TableHead>
                  <TableHead className="w-32 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Recorded Hours
                  </TableHead>
                  <TableHead className="w-32 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Missing Hours
                  </TableHead>
                  <TableHead className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Alert Status
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incompleteReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-1.5">
                        <CheckCircle2 className="size-7 text-emerald-500" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          100% Timesheet Compliance
                        </p>
                        <p className="text-[11px] text-slate-400">
                          All logged working days fulfill the required 8.0 hours.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  incompleteReports.map((rec) => {
                    const missing = 8.0 - rec.totalHours;
                    return (
                      <TableRow key={`${rec.employee_id}_${rec.date}`}>
                        <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {rec.date}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {rec.employee_name}
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {rec.department}
                        </TableCell>
                        <TableCell className="text-center text-xs font-bold text-amber-700 dark:text-amber-400">
                          {rec.totalHours.toFixed(1)} hrs
                        </TableCell>
                        <TableCell className="text-center text-xs font-bold text-rose-600 dark:text-rose-400">
                          -{missing.toFixed(1)} hrs
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px]">
                            Under 8.0 hours
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {reportTab === "projects" && (
        /* Project Resource Breakdown */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {projectReports.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Briefcase className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No project resource data available</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Connect the Real API to load company projects and track logged mandays.
              </p>
            </div>
          ) : (
            projectReports.map((pr) => (
              <div
                key={pr.project_id}
                className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {pr.project_code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {pr.project_name}
                    </h3>
                    <p className="text-xs text-slate-500">{pr.customer_name}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                      {pr.used_mandays}
                    </span>
                    <span className="text-xs text-slate-400 ml-1">MD</span>
                    <p className="text-[10px] text-slate-400">of {pr.allocated_mandays} MD allocated</p>
                  </div>
                </div>

                {/* Task Breakdown list */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Logged Effort by Activity
                  </p>
                  <div className="space-y-1.5 text-xs">
                    {Object.entries(pr.taskBreakdown).length === 0 ? (
                      <p className="text-slate-400 text-[11px]">No hours logged yet</p>
                    ) : (
                      Object.entries(pr.taskBreakdown).map(([task, hrs]) => (
                        <div key={task} className="flex items-center justify-between">
                          <span className="text-slate-700 dark:text-slate-300">{task}</span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {hrs.toFixed(1)} hrs ({(hrs / 8).toFixed(1)} MD)
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {reportTab === "employees" && (
        /* Employee Summary */
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="w-24 text-xs font-bold text-slate-700 dark:text-slate-200">
                  ID
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Employee Name
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Department
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  Total Logged Hours
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  Approved Hours
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  Waiting Hours
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  Leave Taken
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employeeReports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-12 text-center text-xs text-slate-500">
                    No employee timesheet records available.
                  </TableCell>
                </TableRow>
              ) : (
                employeeReports.map((emp) => (
                  <TableRow key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-mono text-xs text-slate-500">
                      {emp.id}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {emp.name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {emp.department}
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-slate-800 dark:text-slate-200">
                      {emp.totalHours.toFixed(1)} hrs
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {emp.approvedHours.toFixed(1)} hrs
                    </TableCell>
                    <TableCell className="text-center text-xs font-bold text-amber-700 dark:text-amber-400">
                      {emp.waitingHours.toFixed(1)} hrs
                    </TableCell>
                    <TableCell className="text-center text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {emp.leaveDays} days
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};
