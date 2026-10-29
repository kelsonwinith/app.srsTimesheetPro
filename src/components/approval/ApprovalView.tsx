"use client";

import React, { useState, useMemo } from "react";
import { useTimesheet } from "@/context/TimesheetContext";
import { TimesheetEntry } from "@/types/timesheet";
import { TimesheetDetailDialog } from "../timesheet/TimesheetDetailDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  CheckCheck,
  Ban,
  User,
  Eye,
  History,
  FileSpreadsheet,
} from "lucide-react";

export const ApprovalView: React.FC = () => {
  const {
    currentUser,
    timesheets,
    projects,
    approveTimesheets,
    rejectTimesheets,
    exportToExcel,
  } = useTimesheet();

  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionTargetIds, setRejectionTargetIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState("");
  const [detailEntry, setDetailEntry] = useState<TimesheetEntry | null>(null);

  // Filters for History Tab
  const [historySearch, setHistorySearch] = useState("");
  const [historyProjectFilter, setHistoryProjectFilter] = useState<string>("ALL");
  const [historyStatusFilter, setHistoryStatusFilter] = useState<string>("ALL");

  // Pending items list
  const pendingItems = useMemo(() => {
    return timesheets
      .filter((t) => t.timesheet_status === "Waiting")
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [timesheets]);

  // History items list
  const historyItems = useMemo(() => {
    return timesheets
      .filter((t) => t.timesheet_status === "Approve" || t.timesheet_status === "Reject")
      .filter((t) => {
        if (historyStatusFilter !== "ALL" && t.timesheet_status !== historyStatusFilter) {
          return false;
        }
        if (historyProjectFilter !== "ALL" && String(t.project_id) !== historyProjectFilter) {
          return false;
        }
        if (historySearch.trim()) {
          const q = historySearch.toLowerCase();
          const matchEmp = t.employee_name.toLowerCase().includes(q);
          const matchProj = t.project_name.toLowerCase().includes(q);
          const matchTask = t.task.toLowerCase().includes(q);
          if (!matchEmp && !matchProj && !matchTask) return false;
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [timesheets, historyStatusFilter, historyProjectFilter, historySearch]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingItems.map((item) => item.timesheet_id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    approveTimesheets(selectedIds);
    setSelectedIds([]);
  };

  const handleOpenRejectDialog = (ids: string[]) => {
    setRejectionTargetIds(ids);
    setRejectionReason("");
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!rejectionReason.trim()) {
      alert("Please provide a reason for rejecting the timesheet.");
      return;
    }
    rejectTimesheets(rejectionTargetIds, rejectionReason);
    setRejectDialogOpen(false);
    setSelectedIds((prev) => prev.filter((id) => !rejectionTargetIds.includes(id)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="size-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Timesheet Approvals
            </h1>
            <p className="text-xs text-slate-500">
              Review, approve, or reject employee timesheets and inspect submission histories.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("pending")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "pending"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Clock className="size-3.5" />
            <span>Pending Requests</span>
            {pendingItems.length > 0 && (
              <Badge className="bg-amber-100 text-amber-900 text-[10px] px-1.5 py-0 font-bold ml-1">
                {pendingItems.length}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab("history")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "history"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <History className="size-3.5" />
            <span>Approval History</span>
          </button>
        </div>
      </div>

      {activeTab === "pending" ? (
        /* ============ PENDING REQUESTS TAB ============ */
        <div className="space-y-4">
          {/* Batch Actions Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-3">
              <Checkbox
                id="select-all"
                checked={
                  pendingItems.length > 0 && selectedIds.length === pendingItems.length
                }
                onCheckedChange={handleSelectAll}
              />
              <label
                htmlFor="select-all"
                className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Select All ({selectedIds.length} of {pendingItems.length} selected)
              </label>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={selectedIds.length === 0}
                onClick={() => handleOpenRejectDialog(selectedIds)}
                className="h-8 text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400"
              >
                <Ban className="size-3.5 mr-1" />
                Reject Selected
              </Button>
              <Button
                size="sm"
                disabled={selectedIds.length === 0}
                onClick={handleBatchApprove}
                className="h-8 text-xs font-semibold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <CheckCheck className="size-3.5 mr-1" />
                Approve Selected ({selectedIds.length})
              </Button>
            </div>
          </div>

          {/* Pending Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="w-28 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Date
                  </TableHead>
                  <TableHead className="w-44 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Employee
                  </TableHead>
                  <TableHead className="w-32 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Duration
                  </TableHead>
                  <TableHead className="min-w-44 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Project
                  </TableHead>
                  <TableHead className="w-36 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Task Type
                  </TableHead>
                  <TableHead className="min-w-48 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Task Detail
                  </TableHead>
                  <TableHead className="w-36 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Quick Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <CheckCircle2 className="size-8 text-emerald-500" />
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          All caught up!
                        </p>
                        <p className="text-[11px] text-slate-400">
                          There are currently no timesheets pending your approval.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingItems.map((item) => {
                    const isSelected = selectedIds.includes(item.timesheet_id);
                    return (
                      <TableRow
                        key={item.timesheet_id}
                        onClick={() => setDetailEntry(item)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? "bg-emerald-50/70 dark:bg-emerald-950/40"
                            : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => handleToggleSelect(item.timesheet_id)}
                          />
                        </TableCell>
                        <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                          {item.date}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.employee_name}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {item.department}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold">{item.start_time} - {item.finish_time}</span>
                          <span className="ml-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                            ({item.man_hour}h)
                          </span>
                        </TableCell>
                        <TableCell className="text-xs">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.project_name}
                          </span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            [{item.project_code}]
                          </span>
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                          {item.task}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          {item.detail}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => approveTimesheets([item.timesheet_id])}
                              className="h-7 px-2 text-xs font-semibold text-emerald-800 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenRejectDialog([item.timesheet_id])}
                              className="h-7 px-2 text-xs font-semibold text-rose-700 border-rose-300 hover:bg-rose-50 dark:text-rose-400"
                            >
                              Reject
                            </Button>
                            <button
                              onClick={() => setDetailEntry(item)}
                              title="Inspect Details"
                              className="p-1 text-slate-400 hover:text-slate-700"
                            >
                              <Eye className="size-3.5" />
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        /* ============ APPROVAL HISTORY TAB ============ */
        <div className="space-y-4">
          {/* History Filters */}
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <div className="relative min-w-48 flex-1">
              <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search employee, project, task..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <Select
              value={historyProjectFilter}
              onValueChange={(val) => {
                if (val !== null) setHistoryProjectFilter(val);
              }}
            >
              <SelectTrigger className="w-48 h-8 text-xs bg-slate-50 dark:bg-slate-800">
                <SelectValue placeholder="All Projects" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Projects</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.project_id} value={String(p.project_id)}>
                      {p.project_code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <Select
              value={historyStatusFilter}
              onValueChange={(val) => {
                if (val !== null) setHistoryStatusFilter(val);
              }}
            >
              <SelectTrigger className="w-36 h-8 text-xs bg-slate-50 dark:bg-slate-800">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="ALL">All Status</SelectItem>
                  <SelectItem value="Approve">Approved Only</SelectItem>
                  <SelectItem value="Reject">Rejected Only</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToExcel(historyItems, "Approval_History.xlsx")}
              className="h-8 gap-1.5 text-xs text-emerald-800 border-emerald-500 font-semibold"
            >
              <FileSpreadsheet className="size-3.5" />
              Export History
            </Button>
          </div>

          {/* History Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                  <TableHead className="w-28 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Date
                  </TableHead>
                  <TableHead className="w-40 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Employee
                  </TableHead>
                  <TableHead className="w-32 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Duration
                  </TableHead>
                  <TableHead className="min-w-44 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Project
                  </TableHead>
                  <TableHead className="min-w-44 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Detail / Reason
                  </TableHead>
                  <TableHead className="w-28 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Status
                  </TableHead>
                  <TableHead className="w-36 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Reviewed By
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historyItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-12 text-center text-xs text-slate-500">
                      No historical records matching the filter criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  historyItems.map((item) => (
                    <TableRow
                      key={item.timesheet_id}
                      onClick={() => setDetailEntry(item)}
                      className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <TableCell className="text-xs font-medium text-slate-900 dark:text-slate-100">
                        {item.date}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {item.employee_name}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {item.department}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        {item.start_time} - {item.finish_time}{" "}
                        <span className="font-bold text-emerald-700 dark:text-emerald-400">
                          ({item.man_hour}h)
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="font-semibold">{item.project_name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono">
                          [{item.project_code}]
                        </span>
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate text-slate-600 dark:text-slate-300">
                        {item.timesheet_status === "Reject" && item.reject_reason ? (
                          <span className="text-rose-600 font-medium">
                            Reason: {item.reject_reason}
                          </span>
                        ) : (
                          item.detail
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.timesheet_status === "Approve" ? (
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold dark:bg-emerald-950 dark:text-emerald-300">
                            Approved
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-semibold dark:bg-rose-950 dark:text-rose-300">
                            Rejected
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        <div>{item.approved_by || "System"}</div>
                        <div className="text-[10px] text-slate-400">
                          {item.approved_at ? new Date(item.approved_at).toLocaleDateString() : ""}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Rejection Dialog with Required Reason */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
              <Ban className="size-5" />
              Reject Timesheet ({rejectionTargetIds.length} item{rejectionTargetIds.length > 1 ? "s" : ""})
            </DialogTitle>
            <DialogDescription>
              Please supply an explanation for rejecting this timesheet submission so the employee can correct it.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Reason for Rejection (Required)
            </label>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Please specify the Jira ticket number, or recheck start/finish times..."
              className="w-full rounded-md border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:outline-hidden dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectDialogOpen(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleConfirmReject}
              className="text-xs font-semibold"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details modal */}
      <TimesheetDetailDialog
        entry={detailEntry}
        open={!!detailEntry}
        onOpenChange={(open) => {
          if (!open) setDetailEntry(null);
        }}
      />
    </div>
  );
};
