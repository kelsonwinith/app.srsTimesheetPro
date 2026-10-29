"use client";

import React, { useState } from "react";
import { TimesheetProvider } from "@/context/TimesheetContext";
import { AppNavbar } from "@/components/layout/AppNavbar";
import { TimesheetView } from "@/components/timesheet/TimesheetView";
import { ApprovalView } from "@/components/approval/ApprovalView";
import { ProjectManagementView } from "@/components/project/ProjectManagementView";
import { ReportView } from "@/components/report/ReportView";
import { SettingView } from "@/components/setting/SettingView";
import { ShieldCheck } from "lucide-react";

export default function HomePage() {
  // Default tab is "timesheet" (My Timesheet)
  const [currentTab, setCurrentTab] = useState<string>("timesheet");

  return (
    <TimesheetProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Navigation Bar */}
        <AppNavbar currentTab={currentTab} onTabChange={setCurrentTab} />

        {/* Main Content Area */}
        <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {currentTab === "timesheet" && <TimesheetView />}
          {currentTab === "approval" && <ApprovalView />}
          {currentTab === "projects" && <ProjectManagementView />}
          {currentTab === "reports" && <ReportView />}
          {currentTab === "settings" && <SettingView />}
        </main>

        {/* Clean Footer */}
        <footer className="mt-auto border-t border-slate-200 bg-white py-4 text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-emerald-800 dark:text-emerald-400">
                Sirisoft Timesheet
              </span>
              <span>•</span>
              <span className="text-[11px] text-slate-400">
                Next.js & shadcn/ui
              </span>
            </div>

            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                <ShieldCheck className="size-3.5" />
                Backend Guard: Read-Only (GET) Mode Active
              </span>
              <span>© 2026 Sirisoft Co., Ltd.</span>
            </div>
          </div>
        </footer>
      </div>
    </TimesheetProvider>
  );
}
