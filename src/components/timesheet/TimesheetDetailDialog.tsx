"use client";

import React from "react";
import { TimesheetEntry } from "@/types/timesheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  Briefcase,
  Tag,
  CheckCircle2,
  XCircle,
  Clock4,
  User,
  Building2,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";

interface TimesheetDetailDialogProps {
  entry: TimesheetEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (entry: TimesheetEntry) => void;
  onDelete?: (id: string) => void;
}

export const TimesheetDetailDialog: React.FC<TimesheetDetailDialogProps> = ({
  entry,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}) => {
  if (!entry) return null;

  const isEditable = entry.timesheet_status === "Waiting";

  const renderStatusBadge = () => {
    switch (entry.timesheet_status) {
      case "Approve":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300">
            <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" />
            Approved
          </Badge>
        );
      case "Reject":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300">
            <XCircle className="size-3.5 mr-1 text-rose-600" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300">
            <Clock4 className="size-3.5 mr-1 text-amber-600" />
            Waiting Approval
          </Badge>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between pr-4">
            <DialogTitle className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Timesheet Entry Details
            </DialogTitle>
            {renderStatusBadge()}
          </div>
          <DialogDescription className="text-xs">
            ID: <span className="font-mono text-slate-500">{entry.timesheet_id}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2 text-xs">
          {/* Rejection Notice */}
          {entry.timesheet_status === "Reject" && entry.reject_reason && (
            <div className="rounded-md border border-rose-200 bg-rose-50 p-3 text-rose-800 dark:border-rose-900 dark:bg-rose-950/60 dark:text-rose-200">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="size-4 text-rose-600" />
                Supervisor Rejection Reason
              </div>
              <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
                {entry.reject_reason}
              </p>
            </div>
          )}

          {/* Employee & Dept Info */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-start gap-2">
              <User className="size-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Employee</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{entry.employee_name}</p>
                <p className="text-[10px] text-slate-400">ID: {entry.employee_id}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Building2 className="size-4 text-slate-400 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Department</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{entry.department}</p>
              </div>
            </div>
          </div>

          {/* Date & Working Time */}
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-start gap-2">
              <Calendar className="size-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Date</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{entry.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Clock className="size-4 text-emerald-600 mt-0.5" />
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Duration</p>
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {entry.start_time} - {entry.finish_time}
                </p>
                <p className="text-emerald-700 font-bold dark:text-emerald-400">
                  {entry.man_hour.toFixed(2)} hours worked
                </p>
              </div>
            </div>
          </div>

          {/* Project & Task */}
          <div className="space-y-2 rounded-lg border border-slate-100 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="flex items-start gap-2">
              <Briefcase className="size-4 text-emerald-600 mt-0.5" />
              <div className="flex-1">
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Project</p>
                <p className="font-bold text-slate-900 dark:text-slate-100">
                  {entry.project_name}
                </p>
                <p className="text-[11px] text-slate-500">[{entry.project_code}]</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase">Task Type</p>
                <p className="font-medium text-slate-800 dark:text-slate-200">{entry.task}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase flex items-center gap-1">
                  <Tag className="size-3 text-slate-400" />
                  Sprint / Tag
                </p>
                <p className="font-medium text-slate-800 dark:text-slate-200">
                  {entry.tag_name || "None"}
                </p>
              </div>
            </div>
          </div>

          {/* Task Detail */}
          <div className="rounded-lg border border-slate-200 p-3 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-[10px] text-slate-400 font-semibold uppercase mb-1">
              Accomplished Work Details
            </p>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {entry.detail}
            </p>
          </div>

          {/* Audit trail */}
          {entry.approved_by && (
            <div className="text-[11px] text-slate-400 italic">
              Reviewed by {entry.approved_by} on{" "}
              {entry.approved_at ? new Date(entry.approved_at).toLocaleString() : "N/A"}
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2">
          {isEditable && onDelete && (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={() => {
                onDelete(entry.timesheet_id);
                onOpenChange(false);
              }}
              className="text-xs"
            >
              <Trash2 className="size-3.5 mr-1" />
              Delete Entry
            </Button>
          )}
          {isEditable && onEdit && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                onEdit(entry);
                onOpenChange(false);
              }}
              className="text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-300"
            >
              <Edit className="size-3.5 mr-1" />
              Edit Entry
            </Button>
          )}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
