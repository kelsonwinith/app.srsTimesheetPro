"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useTimesheet } from "@/context/TimesheetContext";
import { Project, TimesheetEntry } from "@/types/timesheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  Calendar,
  Briefcase,
  Tag,
  FileText,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  Layers,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export interface DaySegment {
  id: string;
  startTime: string;
  finishTime: string;
  projectId: number;
  task: string;
  tagName: string;
  detail: string;
}

const COMMON_TASKS = [
  "Development (Frontend/Backend)",
  "Meeting & Coordination",
  "Requirement Analysis & Design",
  "Testing, QA & Test Automation",
  "Bug Fixing & Incident Resolution",
  "Code Review & Technical Spike",
  "DevOps, CI/CD & Deployment",
  "Documentation & Knowledge Transfer",
];

interface AddTimeEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editEntry?: TimesheetEntry | null;
  initialDate?: string;
}

export const AddTimeEntryDialog: React.FC<AddTimeEntryDialogProps> = ({
  open,
  onOpenChange,
  editEntry,
  initialDate,
}) => {
  const {
    currentUser,
    projects,
    leaveTypes,
    timesheets,
    lockConfig,
    fetchRealTagsForProject,
    addTimesheet,
    updateTimesheet,
  } = useTimesheet();

  const isEdit = !!editEntry;

  // View mode
  const [entryMode, setEntryMode] = useState<"multi" | "single">("multi");
  const [date, setDate] = useState<string>("2026-10-29");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Single Entry / Edit Entry Form State
  const [entryType, setEntryType] = useState<"work" | "leave">("work");
  const [singleIsAllDay, setSingleIsAllDay] = useState(false);
  const [singleStartTime, setSingleStartTime] = useState("09:00");
  const [singleFinishTime, setSingleFinishTime] = useState("18:00");
  const [singleProjectId, setSingleProjectId] = useState<number | undefined>(
    projects[0]?.project_id
  );
  const [singleTask, setSingleTask] = useState<string>(COMMON_TASKS[0]);
  const [singleTag, setSingleTag] = useState<string>("");
  const [singleDetail, setSingleDetail] = useState("");
  const [leaveOption, setLeaveOption] = useState<1 | 2>(2); // 1 = Half, 2 = Full
  const [leaveTypeId, setLeaveTypeId] = useState<number>(leaveTypes[0]?.leave_id || 1);

  // Multi-Segment State
  const [segments, setSegments] = useState<DaySegment[]>([
    {
      id: "seg-1",
      startTime: "09:00",
      finishTime: "18:00",
      projectId: 0,
      task: "",
      tagName: "",
      detail: "",
    },
  ]);

  // Synchronize when opening or editing
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (editEntry) {
        setEntryMode("single");
        setDate(editEntry.date);
        setSingleStartTime(editEntry.start_time);
        setSingleFinishTime(editEntry.finish_time);
        setSingleProjectId(editEntry.project_id);
        setSingleTask(editEntry.task);
        setSingleTag(editEntry.tag_name || "");
        setSingleDetail(editEntry.detail || "");
        if (editEntry.leave > 0) {
          setEntryType("leave");
          setLeaveOption(editEntry.leave === 1 ? 1 : 2);
          setLeaveTypeId(editEntry.leave_type_id || 1);
        } else {
          setEntryType("work");
        }
        setSingleIsAllDay(false);
      } else {
        const targetDate = initialDate || new Date().toISOString().split("T")[0];
        setDate(targetDate);
        setEntryMode("multi");
        setEntryType("work");
        setSingleIsAllDay(false);
        setSingleStartTime("09:00");
        setSingleFinishTime("18:00");
        setSingleDetail("");
        if (projects.length > 0) {
          setSingleProjectId(projects[0].project_id);
          const firstTask = projects[0].tasks?.[0]?.task_name || "";
          setSingleTask(firstTask);
          setSegments([
            {
              id: `seg-${Date.now()}-1`,
              startTime: "09:00",
              finishTime: "18:00",
              projectId: projects[0].project_id,
              task: firstTask,
              tagName: "",
              detail: "",
            },
          ]);
        } else {
          setSingleProjectId(0);
          setSingleTask("");
          setSegments([
            {
              id: `seg-${Date.now()}-1`,
              startTime: "09:00",
              finishTime: "18:00",
              projectId: 0,
              task: "",
              tagName: "",
              detail: "",
            },
          ]);
        }
      }
    }
  }, [open, editEntry, initialDate, projects]);

  // Duration helper
  const getSegmentDuration = (start: string, finish: string): number => {
    if (!start || !finish) return 0;
    const [sh, sm] = start.split(":").map(Number);
    const [fh, fm] = finish.split(":").map(Number);
    const sMin = sh * 60 + sm;
    let fMin = fh * 60 + fm;
    if (fMin === 0 && fh === 0 && fm === 0) fMin = 24 * 60;
    if (fMin <= sMin) return 0;
    return Math.round(((fMin - sMin) / 60) * 100) / 100;
  };

  const totalDayScheduleHours = useMemo(() => {
    return segments.reduce((sum, seg) => sum + getSegmentDuration(seg.startTime, seg.finishTime), 0);
  }, [segments]);

  // Existing logged entries for the target date
  const existingDayEntries = useMemo(() => {
    return timesheets
      .filter((t) => t.employee_id === currentUser.employeeId && t.date === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  }, [timesheets, currentUser.employeeId, date]);

  // Segment operations
  const handleUpdateSegment = (id: string, updates: Partial<DaySegment>) => {
    setSegments((prev) =>
      prev.map((seg) => (seg.id === id ? { ...seg, ...updates } : seg))
    );
  };

  const handleRemoveSegment = (id: string) => {
    if (segments.length <= 1) {
      toast.error("At least one time segment is required.");
      return;
    }
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddNextSlot = () => {
    const lastSeg = segments[segments.length - 1];
    let nextStart = "09:00";
    let nextFinish = "12:00";

    if (lastSeg && lastSeg.finishTime) {
      nextStart = lastSeg.finishTime;
      const [h, m] = nextStart.split(":").map(Number);
      const nextH = Math.min(23, h + 2);
      nextFinish = `${String(nextH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }

    const newSegment: DaySegment = {
      id: `seg-${Date.now()}`,
      startTime: nextStart,
      finishTime: nextFinish,
      projectId: lastSeg ? lastSeg.projectId : projects[0]?.project_id || 0,
      task: lastSeg ? lastSeg.task : COMMON_TASKS[0],
      tagName: "",
      detail: "",
    };

    setSegments((prev) => [...prev, newSegment]);
  };

  const handleDuplicateSegment = (seg: DaySegment) => {
    const [fh, fm] = seg.finishTime.split(":").map(Number);
    const newStart = seg.finishTime;
    const dur = getSegmentDuration(seg.startTime, seg.finishTime);
    const newFinishH = Math.min(23, Math.round(fh + (dur || 2)));
    const newFinish = `${String(newFinishH).padStart(2, "0")}:${String(fm).padStart(2, "0")}`;

    const newSeg: DaySegment = {
      ...seg,
      id: `seg-${Date.now()}`,
      startTime: newStart,
      finishTime: newFinish,
    };
    setSegments((prev) => [...prev, newSeg]);
  };

  // Submit Multi-Segment Schedule
  const handleSubmitMultiSchedule = () => {
    setErrorMessage(null);

    // Validate segments
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const dur = getSegmentDuration(seg.startTime, seg.finishTime);
      if (dur <= 0) {
        setErrorMessage(`Slot #${i + 1} (${seg.startTime} - ${seg.finishTime}) has invalid time. Finish time must be after start time.`);
        return;
      }
      if (!seg.projectId && projects.length > 0) {
        setErrorMessage(`Slot #${i + 1} has no project selected.`);
        return;
      }
    }

    // Sort segments chronologically
    const sorted = [...segments].sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Check for overlap among segments
    for (let i = 0; i < sorted.length - 1; i++) {
      const cur = sorted[i];
      const next = sorted[i + 1];
      if (cur.finishTime > next.startTime) {
        setErrorMessage(
          `Time conflict detected between Slot (${cur.startTime} - ${cur.finishTime}) and (${next.startTime} - ${next.finishTime}). Please ensure slots do not overlap.`
        );
        return;
      }
    }

    // Submit each segment sequentially
    let successCount = 0;
    for (const seg of sorted) {
      const proj = projects.find((p) => p.project_id === seg.projectId) || projects[0];
      const tagObj = proj?.tags.find((t) => t.tag_name === seg.tagName);
      const dur = getSegmentDuration(seg.startTime, seg.finishTime);

      const res = addTimesheet({
        date,
        start_time: seg.startTime,
        finish_time: seg.finishTime,
        man_hour: dur,
        project_id: proj ? proj.project_id : 101,
        project_name: proj ? proj.project_name : "Sirisoft Project",
        project_code: proj ? proj.project_code : "PRJ",
        task: seg.task,
        task_id: 1,
        tag: !!seg.tagName,
        tag_name: seg.tagName || undefined,
        tag_id: tagObj?.tag_timesheet_id,
        element_id: tagObj?.tag_timesheet_id,
        detail: seg.detail || `${seg.task} on ${proj?.project_code || "project"}`,
        leave: 0,
      });

      if (res.success) {
        successCount++;
      } else {
        setErrorMessage(res.error || "Failed to log some slots.");
        return;
      }
    }

    toast.success(`Successfully logged ${successCount} time slots (${totalDayScheduleHours}h total)!`);
    onOpenChange(false);
  };

  // Submit Single / Edit Entry
  const handleSubmitSingle = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Leave entry
    if (entryType === "leave") {
      const leaveObj = leaveTypes.find((l) => l.leave_id === leaveTypeId) || leaveTypes[0];
      const manHour = leaveOption === 1 ? 4 : 8;

      if (isEdit && editEntry) {
        const res = updateTimesheet(editEntry.timesheet_id, {
          date,
          start_time: "09:00",
          finish_time: leaveOption === 1 ? "13:00" : "18:00",
          man_hour: manHour,
          task: leaveObj ? leaveObj.leave_name : "Leave",
          leave: leaveOption,
          leave_type_id: leaveTypeId,
          detail: singleDetail || "Leave request",
        });
        if (!res.success) {
          setErrorMessage(res.error || "Failed to update entry.");
          return;
        }
        toast.success("Leave entry updated successfully!");
      } else {
        const res = addTimesheet({
          date,
          start_time: "09:00",
          finish_time: leaveOption === 1 ? "13:00" : "18:00",
          man_hour: manHour,
          project_id: 0,
          project_name: "",
          project_code: "LEAVE",
          task: leaveObj ? leaveObj.leave_name : "Leave",
          task_id: 0,
          tag: false,
          detail: singleDetail || "Leave request",
          leave: leaveOption,
          leave_type_id: leaveTypeId,
        });
        if (!res.success) {
          setErrorMessage(res.error || "Failed to add leave.");
          return;
        }
        toast.success("Leave entry logged successfully!");
      }
      onOpenChange(false);
      return;
    }

    // Work entry
    const proj = projects.find((p) => p.project_id === singleProjectId) || projects[0];
    const tagObj = proj?.tags.find((t) => t.tag_name === singleTag);
    const dur = singleIsAllDay ? 8 : getSegmentDuration(singleStartTime, singleFinishTime);

    if (!singleIsAllDay && dur <= 0) {
      setErrorMessage("Finish time must be after start time.");
      return;
    }

    if (isEdit && editEntry) {
      const res = updateTimesheet(editEntry.timesheet_id, {
        date,
        start_time: singleIsAllDay ? "09:00" : singleStartTime,
        finish_time: singleIsAllDay ? "18:00" : singleFinishTime,
        man_hour: dur,
        project_id: proj ? proj.project_id : editEntry.project_id,
        project_name: proj ? proj.project_name : editEntry.project_name,
        project_code: proj ? proj.project_code : editEntry.project_code,
        task: singleTask,
        tag: !!singleTag,
        tag_name: singleTag || undefined,
        tag_id: tagObj?.tag_timesheet_id,
        element_id: tagObj?.tag_timesheet_id,
        detail: singleDetail,
      });

      if (!res.success) {
        setErrorMessage(res.error || "Failed to update entry.");
        return;
      }
      toast.success("Time entry updated successfully!");
    } else {
      const res = addTimesheet(
        {
          date,
          start_time: singleIsAllDay ? "09:00" : singleStartTime,
          finish_time: singleIsAllDay ? "18:00" : singleFinishTime,
          man_hour: dur,
          project_id: proj ? proj.project_id : 101,
          project_name: proj ? proj.project_name : "Sirisoft Project",
          project_code: proj ? proj.project_code : "PRJ",
          task: singleTask,
          task_id: 1,
          tag: !!singleTag,
          tag_name: singleTag,
          tag_id: tagObj?.tag_timesheet_id,
          element_id: tagObj?.tag_timesheet_id,
          detail: singleDetail || "Project work",
          leave: 0,
        },
        singleIsAllDay
      );

      if (!res.success) {
        setErrorMessage(res.error || "Failed to add entry.");
        return;
      }
      toast.success("Time entry logged successfully!");
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[96vw] max-w-5xl sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
            <div>
              <DialogTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100 text-base font-bold">
                <Clock className="size-5 text-emerald-600" />
                <span>{isEdit ? "Edit Time Entry" : "Log Time Entry"}</span>
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? "Update your existing timesheet record."
                  : "Batch-log your entire day's hourly slots (e.g. 10-12, 12-13, 13-15, 15-18) in a single click."}
              </DialogDescription>
            </div>

            {/* Mode Switcher (Multi Full-Day vs Single) */}
            {!isEdit && (
              <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-700 dark:bg-slate-800 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setEntryMode("multi")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition ${
                    entryMode === "multi"
                      ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Layers className="size-3.5" />
                  <span>Full Day Planner ({segments.length} slots)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEntryMode("single")}
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                    entryMode === "single"
                      ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <Clock className="size-3.5" />
                  <span>Single Entry</span>
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {errorMessage && (
          <Alert variant="destructive" className="py-2.5 text-xs">
            <AlertCircle className="size-4" />
            <AlertDescription className="font-semibold">{errorMessage}</AlertDescription>
          </Alert>
        )}

        {/* Date Selector Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <Label className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Calendar className="size-3.5 text-emerald-600" />
              Target Date:
            </Label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={lockConfig.unlock_timesheet_date || undefined}
              className="h-8 text-xs font-bold bg-white dark:bg-slate-800 w-44"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Already logged on this date:
            </span>
            <Badge variant="outline" className="text-xs font-mono font-bold text-emerald-700 border-emerald-300 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-300">
              {existingDayEntries.reduce((acc, cur) => acc + cur.man_hour, 0)} hrs ({existingDayEntries.length} entries)
            </Badge>
          </div>
        </div>

        {/* MODE A: Multi-Segment Full Day Planner */}
        {entryMode === "multi" && !isEdit ? (
          <div className="space-y-4 py-1">
            {/* Visual Timeline Bar */}
            <div className="space-y-1.5 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-emerald-600" />
                  Day Timeline Visualizer:
                </span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">
                  Total Planned: {totalDayScheduleHours} hours
                </span>
              </div>

              {/* Progress track */}
              <div className="h-7 w-full overflow-hidden rounded-lg bg-slate-100 flex p-0.5 gap-1 dark:bg-slate-800">
                {segments.map((seg, idx) => {
                  const dur = getSegmentDuration(seg.startTime, seg.finishTime);
                  const proj = projects.find((p) => p.project_id === seg.projectId);
                  return (
                    <div
                      key={seg.id}
                      style={{ flex: Math.max(0.5, dur) }}
                      className="min-w-0 h-full rounded bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center text-[10px] font-bold px-1.5 transition cursor-pointer shadow-xs truncate"
                      title={`Slot #${idx + 1}: ${seg.startTime}-${seg.finishTime} (${dur}h) - ${proj?.project_code || "Project"}`}
                    >
                      <span className="truncate">#{idx + 1}: {seg.startTime}-{seg.finishTime} ({dur}h)</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* List of Slots */}
            <div className="space-y-3">
              {segments.map((seg, index) => {
                const segDuration = getSegmentDuration(seg.startTime, seg.finishTime);
                const currentProj = projects.find((p) => p.project_id === seg.projectId);

                return (
                  <div
                    key={seg.id}
                    className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-2xs dark:border-slate-800 dark:bg-slate-900 hover:border-emerald-300 transition"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5 dark:border-slate-800">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex size-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white shrink-0">
                          {index + 1}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          Slot #{index + 1}: {seg.startTime} → {seg.finishTime}
                        </span>
                        <Badge
                          variant="secondary"
                          className={`text-[10px] font-mono ${
                            segDuration > 0
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {segDuration > 0 ? `${segDuration} Hours` : "Invalid Time"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicateSegment(seg)}
                          className="h-7 px-2.5 text-[11px] text-slate-600 hover:text-emerald-700"
                          title="Duplicate slot"
                        >
                          <Copy className="size-3 mr-1" />
                          <span>Duplicate</span>
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled={segments.length <= 1}
                          onClick={() => handleRemoveSegment(seg.id)}
                          className="h-7 px-2 text-[11px] text-slate-400 hover:text-rose-600 disabled:opacity-30"
                          title="Remove slot"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Slot Fields Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                      {/* Start Time */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-semibold">Start Time</Label>
                        <Input
                          type="time"
                          value={seg.startTime}
                          onChange={(e) => handleUpdateSegment(seg.id, { startTime: e.target.value })}
                          className="h-8 text-xs font-mono w-full"
                        />
                      </div>

                      {/* Finish Time */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-semibold">Finish Time</Label>
                        <Input
                          type="time"
                          value={seg.finishTime}
                          onChange={(e) => handleUpdateSegment(seg.id, { finishTime: e.target.value })}
                          className="h-8 text-xs font-mono w-full"
                        />
                      </div>

                      {/* Project */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-semibold">Project</Label>
                        <Select
                          value={seg.projectId ? String(seg.projectId) : (projects[0]?.project_id ? String(projects[0].project_id) : "")}
                          onValueChange={(val) => {
                            if (val !== null) handleUpdateSegment(seg.id, { projectId: Number(val), tagName: "" });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Select Project" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>Available Projects</SelectLabel>
                              {projects.map((p) => (
                                <SelectItem key={p.project_id} value={String(p.project_id)} className="text-xs">
                                  {p.project_code} - {p.project_name}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Task */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-semibold">Task</Label>
                        <Select
                          value={seg.task}
                          onValueChange={(val) => {
                            if (val !== null) handleUpdateSegment(seg.id, { task: val });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Task" />
                          </SelectTrigger>
                          <SelectContent>
                            {COMMON_TASKS.map((t) => (
                              <SelectItem key={t} value={t} className="text-xs">
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Tag & Detail Row */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1">
                      {/* Sprint / Tag */}
                      <div className="space-y-1">
                        <Label className="text-[11px] text-slate-500 font-semibold">Sprint / Tag (Optional)</Label>
                        <Select
                          value={seg.tagName || "NONE"}
                          onValueChange={(val) => {
                            if (val !== null) handleUpdateSegment(seg.id, { tagName: val === "NONE" ? "" : val });
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs w-full">
                            <SelectValue placeholder="Sprint / Tag" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE" className="text-xs italic text-slate-400">
                              -- No Tag --
                            </SelectItem>
                            {currentProj?.tags.map((tg) => (
                              <SelectItem key={tg.tag_timesheet_id} value={tg.tag_name} className="text-xs">
                                {tg.tag_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Notes / Detail */}
                      <div className="md:col-span-2 space-y-1">
                        <Label className="text-[11px] text-slate-500 font-semibold">Work Detail / Notes</Label>
                        <Input
                          type="text"
                          placeholder="e.g. Sprint planning meeting, bug fix for login flow..."
                          value={seg.detail}
                          onChange={(e) => handleUpdateSegment(seg.id, { detail: e.target.value })}
                          className="h-8 text-xs w-full"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add Next Slot Button */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddNextSlot}
              className="w-full border-dashed border-emerald-400 bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-800 text-xs font-bold py-2.5 dark:bg-emerald-950/20 dark:text-emerald-300"
            >
              <Plus className="size-4 mr-1 text-emerald-700" />
              <span>Add Another Time Slot (Chains from previous slot)</span>
            </Button>
          </div>
        ) : (
          /* MODE B: Single Entry Form / Edit Form */
          <form onSubmit={handleSubmitSingle} className="space-y-4 py-2 text-xs">
            {/* Work vs Leave Switcher (Only if not editing existing work) */}
            {!isEdit && (
              <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-800 w-fit">
                <button
                  type="button"
                  onClick={() => setEntryType("work")}
                  className={`rounded-md px-3 py-1 font-bold transition ${
                    entryType === "work"
                      ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300"
                      : "text-slate-500"
                  }`}
                >
                  Work Entry
                </button>
                <button
                  type="button"
                  onClick={() => setEntryType("leave")}
                  className={`rounded-md px-3 py-1 font-bold transition ${
                    entryType === "leave"
                      ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300"
                      : "text-slate-500"
                  }`}
                >
                  Leave / Timeoff
                </button>
              </div>
            )}

            {entryType === "work" ? (
              <>
                {/* All Day Checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="singleAllDay"
                    checked={singleIsAllDay}
                    onCheckedChange={(checked) => setSingleIsAllDay(!!checked)}
                  />
                  <Label htmlFor="singleAllDay" className="text-xs font-semibold cursor-pointer">
                    Full Work Day (09:00 - 18:00, 8 Hours)
                  </Label>
                </div>

                {/* Time Pickers (if not all day) */}
                {!singleIsAllDay && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Start Time</Label>
                      <Input
                        type="time"
                        value={singleStartTime}
                        onChange={(e) => setSingleStartTime(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Finish Time</Label>
                      <Input
                        type="time"
                        value={singleFinishTime}
                        onChange={(e) => setSingleFinishTime(e.target.value)}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Project Selection */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Project</Label>
                  <Select
                    value={singleProjectId ? String(singleProjectId) : ""}
                    onValueChange={(val) => {
                      if (val !== null) {
                        setSingleProjectId(Number(val));
                        setSingleTag("");
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select Project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Projects</SelectLabel>
                        {projects.map((p) => (
                          <SelectItem key={p.project_id} value={String(p.project_id)} className="text-xs">
                            {p.project_code} - {p.project_name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Selection */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Task</Label>
                  <Select
                    value={singleTask}
                    onValueChange={(val) => {
                      if (val !== null) setSingleTask(val);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Task" />
                    </SelectTrigger>
                    <SelectContent>
                      {COMMON_TASKS.map((t) => (
                        <SelectItem key={t} value={t} className="text-xs">
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Sprint / Tag */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Sprint / Tag</Label>
                  <Select
                    value={singleTag || "NONE"}
                    onValueChange={(val) => {
                      if (val !== null) setSingleTag(val === "NONE" ? "" : val);
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Sprint / Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE" className="text-xs italic text-slate-400">
                        -- No Tag --
                      </SelectItem>
                      {projects
                        .find((p) => p.project_id === singleProjectId)
                        ?.tags.map((tg) => (
                          <SelectItem key={tg.tag_timesheet_id} value={tg.tag_name} className="text-xs">
                            {tg.tag_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Detail */}
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Work Detail</Label>
                  <Input
                    type="text"
                    value={singleDetail}
                    onChange={(e) => setSingleDetail(e.target.value)}
                    placeholder="Describe your work..."
                    className="h-8 text-xs"
                  />
                </div>
              </>
            ) : (
              /* Leave Options */
              <>
                <div className="space-y-1">
                  <Label className="text-xs font-medium">Leave Type</Label>
                  <Select
                    value={String(leaveTypeId)}
                    onValueChange={(val) => {
                      if (val !== null) setLeaveTypeId(Number(val));
                    }}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Leave Type" />
                    </SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((l) => (
                        <SelectItem key={l.leave_id} value={String(l.leave_id)} className="text-xs">
                          {l.leave_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Duration</Label>
                  <div className="flex gap-4 pt-1">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="leaveOpt"
                        checked={leaveOption === 2}
                        onChange={() => setLeaveOption(2)}
                      />
                      <span>Full Day (8 Hours)</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="leaveOpt"
                        checked={leaveOption === 1}
                        onChange={() => setLeaveOption(1)}
                      />
                      <span>Half Day (4 Hours)</span>
                    </label>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-medium">Reason / Remark</Label>
                  <Input
                    type="text"
                    value={singleDetail}
                    onChange={(e) => setSingleDetail(e.target.value)}
                    placeholder="Leave reason..."
                    className="h-8 text-xs"
                  />
                </div>
              </>
            )}
          </form>
        )}

        <DialogFooter className="gap-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Cancel
          </Button>

          {entryMode === "multi" && !isEdit ? (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitMultiSchedule}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 px-4 shadow-sm"
            >
              <CheckCircle2 className="size-4" />
              <span>Log Entire Day ({segments.length} Slots • {totalDayScheduleHours}h)</span>
            </Button>
          ) : (
            <Button
              type="button"
              size="sm"
              onClick={handleSubmitSingle}
              className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 px-4 shadow-sm"
            >
              <CheckCircle2 className="size-4" />
              <span>{isEdit ? "Update Entry" : "Save Entry"}</span>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
