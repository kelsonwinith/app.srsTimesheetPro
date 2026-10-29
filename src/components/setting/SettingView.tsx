"use client";

import React, { useState } from "react";
import { useTimesheet } from "@/context/TimesheetContext";
import { safeFetchBackend } from "@/services/apiSafetyClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Lock,
  ShieldCheck,
  RotateCcw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Play,
  Terminal,
} from "lucide-react";

export const SettingView: React.FC = () => {
  const {
    lockConfig,
    updateLockDate,
    currentUser,
    resetAllData,
    refreshAuditLogs,
    auditLogs,
  } = useTimesheet();

  const [cutoffDate, setCutoffDate] = useState(lockConfig.unlock_timesheet_date);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Safety test states
  const [testEndpoint, setTestEndpoint] = useState("/timesheet-service/leave");
  const [testResponse, setTestResponse] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const handleSaveCutoff = (e: React.FormEvent) => {
    e.preventDefault();
    updateLockDate(cutoffDate);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestSafeGet = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await safeFetchBackend(testEndpoint, { method: "GET" });
      setTestResponse(JSON.stringify(res, null, 2));
      refreshAuditLogs();
    } catch (err: unknown) {
      setTestResponse(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestBlockedMutation = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      // Intentionally dispatch a POST request through the safety client
      const res = await safeFetchBackend("/timesheet-service/time-sheet", {
        method: "POST",
        body: JSON.stringify({ test: "mutation" }),
      });
      setTestResponse(JSON.stringify(res, null, 2));
      refreshAuditLogs();
    } catch (err: unknown) {
      setTestResponse(`Security Guard Intercepted: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          <Settings className="size-6 text-emerald-700 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
            System & Monthly Lock Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure cutoff lockdown dates, review backend safety rules, and manage data.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Cutoff Date Configuration */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center gap-2">
            <Lock className="size-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Monthly Timesheet Cutoff Date
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            Employees cannot create or modify timesheets dated before this cutoff date.
            Used by Payroll and PMO for monthly reconciliation.
          </p>

          <form onSubmit={handleSaveCutoff} className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Unlock From Date (Cutoff)
              </label>
              <Input
                type="date"
                value={cutoffDate}
                onChange={(e) => setCutoffDate(e.target.value)}
                className="text-xs bg-slate-50 dark:bg-slate-800"
                required
              />
            </div>

            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 dark:bg-slate-800/60 space-y-1">
              <div>
                Current Cutoff: <strong className="text-slate-800 dark:text-slate-200">{lockConfig.unlock_timesheet_date}</strong>
              </div>
              <div className="text-[11px] text-slate-400">
                Last modified by {lockConfig.updated_by} on{" "}
                {new Date(lockConfig.updated_at).toLocaleDateString()}
              </div>
            </div>

            {saveSuccess && (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Cutoff date updated successfully!
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold"
            >
              Update Cutoff Date
            </Button>
          </form>
        </div>

        {/* Backend Read-Only Safety Verifier */}
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Backend Safety Interceptor (R-Only Guard)
              </h2>
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px]">
              Guard Active
            </Badge>
          </div>

          <p className="text-xs text-slate-500">
            Per your prompt instructions, the application enforces a strict rule: only HTTP GET
            (Read) is allowed. All POST, PUT, DELETE, PATCH calls to the backend are blocked.
          </p>

          <div className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Test Safe Endpoint (GET)
              </label>
              <Input
                type="text"
                value={testEndpoint}
                onChange={(e) => setTestEndpoint(e.target.value)}
                placeholder="/timesheet-service/leave"
                className="text-xs font-mono bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestSafeGet}
                disabled={isTesting}
                className="flex-1 text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300"
              >
                <Play className="size-3 mr-1" />
                Test Safe GET Request
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTestBlockedMutation}
                disabled={isTesting}
                className="flex-1 text-xs text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400"
              >
                <AlertTriangle className="size-3 mr-1" />
                Test Blocked POST
              </Button>
            </div>

            {testResponse && (
              <div className="rounded-lg border border-slate-200 bg-slate-950 p-3 text-[11px] font-mono text-emerald-400 dark:border-slate-800 max-h-48 overflow-y-auto">
                <div className="text-slate-400 mb-1 flex items-center gap-1">
                  <Terminal className="size-3" />
                  Interceptor Console:
                </div>
                <pre className="whitespace-pre-wrap">{testResponse}</pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Permissions Matrix & Reset */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
          Role Permissions Matrix (Reverse-Engineered Xt Configuration)
        </h3>
        <p className="text-xs text-slate-500">
          Dynamic access rules evaluated based on current user persona.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {[
            { perm: "timesheet", label: "My Timesheet" },
            { perm: "approval", label: "Timesheet Approvals" },
            { perm: "projectManagement", label: "Project Management" },
            { perm: "report", label: "Reports & Analytics" },
            { perm: "setting", label: "System Settings" },
            { perm: "monthlyManagement", label: "Cutoff Lock Management" },
            { perm: "exportReport", label: "Excel Export" },
            { perm: "customerManagement", label: "Customer Directory" },
          ].map(({ perm, label }) => {
            const hasAccess =
              currentUser.role === "Admin" || currentUser.menu.includes(perm);
            return (
              <div
                key={perm}
                className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  hasAccess
                    ? "bg-emerald-50/60 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                    : "bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800/40 dark:border-slate-700"
                }`}
              >
                <span className="font-semibold">{label}</span>
                {hasAccess ? (
                  <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <span className="text-[10px] text-slate-400 font-bold">LOCKED</span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Clear Local Data
            </p>
            <p className="text-[11px] text-slate-400">
              Clears all local timesheet entries and resets stored cache.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm("Clear all local timesheet entries?")) {
                resetAllData();
              }
            }}
            className="text-xs"
          >
            <RotateCcw className="size-3.5 mr-1" />
            Clear Local Data
          </Button>
        </div>
      </div>
    </div>
  );
};
