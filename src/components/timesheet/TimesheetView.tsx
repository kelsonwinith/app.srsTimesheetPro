"use client";

import React, { useState, useMemo } from "react";
import Image from "next/image";
import { useTimesheet } from "@/context/TimesheetContext";
import { TimesheetEntry } from "@/types/timesheet";
import { AddTimeEntryDialog } from "./AddTimeEntryDialog";
import { TimesheetDetailDialog } from "./TimesheetDetailDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  CalendarDays,
  Plus,
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  Calendar as CalendarIcon,
  List,
  Sparkles,
  ChevronDown,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const TimesheetView: React.FC = () => {
  const {
    currentUser,
    timesheets,
    deleteTimesheet,
    exportToExcel,
    exportToCSV,
    calculateMonthSummary,
  } = useTimesheet();

  // Selected date state (initialized statically for Next.js prerender, updated in useEffect)
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(10);
  const [viewMode, setViewModeState] = useState<"calendar" | "table">("calendar");

  const setViewMode = (mode: "calendar" | "table") => {
    setViewModeState(mode);
    try {
      localStorage.setItem("sirisoft_view_mode", mode);
    } catch {}
  };
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Waiting" | "Approve" | "Reject">("ALL");

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimesheetEntry | null>(null);
  const [selectedDetailEntry, setSelectedDetailEntry] = useState<TimesheetEntry | null>(null);
  const [prefilledDate, setPrefilledDate] = useState<string | undefined>(undefined);
  const [todayStr, setTodayStr] = useState<string>("");

  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(10);

  React.useEffect(() => {
    const now = new Date();
    setTodayStr(now.toISOString().split("T")[0]);
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
    setSelectedMonth(now.getMonth() + 1);
    try {
      const saved = localStorage.getItem("sirisoft_view_mode");
      if (saved === "calendar" || saved === "table") {
        setViewModeState(saved);
      }
    } catch {}
  }, []);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState<number>(selectedYear);

  React.useEffect(() => {
    setPickerYear(selectedYear);
  }, [selectedYear]);

  const isNextMonthDisabled =
    selectedYear > currentYear ||
    (selectedYear === currentYear && selectedMonth >= currentMonth);

  // Month navigation
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((y) => y - 1);
    } else {
      setSelectedMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (isNextMonthDisabled) return;
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((y) => y + 1);
    } else {
      setSelectedMonth((m) => m + 1);
    }
  };

  const monthString = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`;

  // Month summary for the current user
  const summary = useMemo(
    () => calculateMonthSummary(monthString, currentUser.employeeId),
    [monthString, currentUser.employeeId, calculateMonthSummary]
  );

  // Filtered timesheets for the current user and month
  const userEntries = useMemo(() => {
    return timesheets.filter((t) => {
      // Must match current user
      if (t.employee_id !== currentUser.employeeId) return false;

      // Must match current month
      if (!t.date.startsWith(monthString)) return false;

      // Status filter
      if (statusFilter !== "ALL" && t.timesheet_status !== statusFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchProject = t.project_name.toLowerCase().includes(q) || t.project_code.toLowerCase().includes(q);
        const matchTask = t.task.toLowerCase().includes(q);
        const matchTag = (t.tag_name || "").toLowerCase().includes(q);
        const matchDetail = t.detail.toLowerCase().includes(q);
        if (!matchProject && !matchTask && !matchTag && !matchDetail) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [timesheets, currentUser.employeeId, monthString, statusFilter, searchQuery]);

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleEdit = (entry: TimesheetEntry) => {
    setEditingEntry(entry);
    setIsAddOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this timesheet entry?")) {
      deleteTimesheet(id);
    }
  };

  const handleOpenAddForDate = (dateStr: string) => {
    setEditingEntry(null);
    setPrefilledDate(dateStr);
    setIsAddOpen(true);
  };

  // Calendar Day Generation (Sunday - Saturday)
  const calendarDays = useMemo(() => {
    const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    const firstDayIndex = new Date(selectedYear, selectedMonth - 1, 1).getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
    // Sun-Sat: Sunday is 0, so startOffset is firstDayIndex directly
    const startOffset = firstDayIndex;

    const days: { dateStr: string; dayNumber: number; entries: TimesheetEntry[]; totalHours: number; isWeekend: boolean }[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, day).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      const dayEntries = timesheets.filter(
        (t) => t.employee_id === currentUser.employeeId && t.date === dateStr && t.timesheet_status !== "Reject"
      );

      const totalHours = dayEntries.reduce((acc, cur) => acc + cur.man_hour, 0);

      days.push({
        dateStr,
        dayNumber: day,
        entries: dayEntries,
        totalHours,
        isWeekend,
      });
    }

    return { startOffset, days };
  }, [selectedYear, selectedMonth, timesheets, currentUser.employeeId]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <CalendarDays className="size-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Timesheet
            </h1>
            <p className="text-xs text-slate-500">
              Track your daily work log, sprint allocation, and timeoff requests.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Dual View Toggle */}
          <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setViewMode("calendar")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "calendar"
                  ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <CalendarIcon className="size-3.5" />
              <span>Calendar</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "table"
                  ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
              }`}
            >
              <List className="size-3.5" />
              <span>Table</span>
            </button>
          </div>

          <Button
            onClick={() => {
              setEditingEntry(null);
              setPrefilledDate(undefined);
              setIsAddOpen(true);
            }}
            className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-xs"
          >
            <Plus className="size-4 mr-1" />
            Add Time Entry
          </Button>
        </div>
      </div>

      {/* Month Filter & Controls Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-2xs sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
        {/* Month Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Search By:</span>
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-1 py-0.5 dark:border-slate-700 dark:bg-slate-800">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="size-7"
              title="Previous Month"
            >
              <ChevronLeft className="size-4" />
            </Button>

            {/* Clickable Calendar Dropdown to select Month and Year */}
            <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
              <PopoverTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-bold text-slate-800 hover:text-emerald-700 hover:bg-slate-200/60 dark:text-slate-200 dark:hover:text-emerald-400 dark:hover:bg-slate-700 transition"
                  >
                    <CalendarIcon className="size-3.5 text-emerald-600" />
                    <span>{monthNames[selectedMonth - 1]} {selectedYear}</span>
                    <ChevronDown className="size-3 text-slate-400" />
                  </button>
                }
              />
              <PopoverContent align="start" className="w-64 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl space-y-3">
                {/* Year Controller */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 dark:border-slate-800">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7"
                    onClick={() => setPickerYear((y) => y - 1)}
                    title="Previous Year"
                  >
                    <ChevronLeft className="size-3.5" />
                  </Button>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 font-mono">
                    {pickerYear}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-7 disabled:opacity-30 disabled:cursor-not-allowed"
                    disabled={pickerYear >= currentYear}
                    onClick={() => setPickerYear((y) => Math.min(currentYear, y + 1))}
                    title={pickerYear >= currentYear ? "Future year is not available" : "Next Year"}
                  >
                    <ChevronRight className="size-3.5" />
                  </Button>
                </div>

                {/* 12 Months Grid */}
                <div className="grid grid-cols-3 gap-1.5">
                  {monthNames.map((mName, mIdx) => {
                    const isSelected = selectedYear === pickerYear && selectedMonth === mIdx + 1;
                    const isFuture = pickerYear > currentYear || (pickerYear === currentYear && mIdx + 1 > currentMonth);

                    return (
                      <button
                        key={mName}
                        type="button"
                        disabled={isFuture}
                        onClick={() => {
                          setSelectedYear(pickerYear);
                          setSelectedMonth(mIdx + 1);
                          setPickerOpen(false);
                        }}
                        className={`rounded-lg py-1.5 text-xs font-semibold transition ${
                          isSelected
                            ? "bg-emerald-700 text-white font-bold shadow-xs"
                            : isFuture
                            ? "text-slate-300 dark:text-slate-600 cursor-not-allowed bg-slate-50/50 dark:bg-slate-800/30"
                            : "text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-slate-800"
                        }`}
                      >
                        {mName.substring(0, 3)}
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              disabled={isNextMonthDisabled}
              className="size-7 disabled:opacity-30 disabled:cursor-not-allowed"
              title={isNextMonthDisabled ? "Next month is not available" : "Next Month"}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Search & Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search Input */}
          <div className="relative min-w-44 flex-1 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder="Search project, task, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="hidden lg:flex items-center gap-1">
            {(["ALL", "Waiting", "Approve", "Reject"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                  statusFilter === st
                    ? "bg-emerald-700 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Export to Excel */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportToExcel(userEntries, `Sirisoft_Timesheet_${monthString}.xlsx`)}
            className="h-8 gap-1.5 border-emerald-600 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 text-xs font-semibold"
          >
            <div className="relative size-4">
              <Image
                src="/assets/images/excel.svg"
                alt="Excel"
                fill
                className="object-contain"
              />
            </div>
            Export
          </Button>
        </div>
      </div>

      {/* Main View Area (Calendar View First and Default) */}
      {viewMode === "calendar" ? (
        /* ============ CALENDAR & TIMELINE VIEW ============ */
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
          {/* Day of Week Header */}
          <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-slate-500">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Blank offset placeholders without rendering visible box */}
            {Array.from({ length: calendarDays.startOffset }).map((_, idx) => (
              <div key={`offset-${idx}`} className="hidden sm:block" />
            ))}

            {/* Actual Days */}
            {calendarDays.days.map((day) => {
              const isToday = todayStr === day.dateStr;
              const isComplete = day.totalHours >= 8.0;
              const isIncomplete = day.totalHours > 0 && day.totalHours < 8.0;

              return (
                <div
                  key={day.dateStr}
                  onClick={() => handleOpenAddForDate(day.dateStr)}
                  className={`group relative min-h-24 rounded-lg border p-2 flex flex-col justify-between transition cursor-pointer ${
                    isToday
                      ? "border-emerald-600 bg-emerald-50/30 dark:border-emerald-400 dark:bg-emerald-950/20"
                      : day.isWeekend
                      ? "border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-900/40"
                      : "border-slate-200 bg-white hover:border-emerald-300 hover:shadow-xs dark:border-slate-800 dark:bg-slate-900"
                  }`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`size-6 flex items-center justify-center rounded-full text-xs font-bold ${
                        isToday
                          ? "bg-emerald-700 text-white"
                          : "text-slate-700 dark:text-slate-300"
                      }`}
                    >
                      {day.dayNumber}
                    </span>

                    {day.totalHours > 0 && (
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                          isComplete
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : isIncomplete
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {day.totalHours.toFixed(1)}h
                      </span>
                    )}
                  </div>

                  {/* Day Entries mini pills */}
                  <div className="mt-1 space-y-1 flex-1 overflow-hidden">
                    {day.entries.slice(0, 2).map((e) => (
                      <div
                        key={e.timesheet_id}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          setSelectedDetailEntry(e);
                        }}
                        className={`truncate rounded px-1.5 py-0.5 text-[10px] font-medium ${
                          e.leave > 0
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300"
                            : e.timesheet_status === "Approve"
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300"
                            : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                      >
                        {e.leave > 0 ? e.task : e.project_code}: {e.man_hour}h
                      </div>
                    ))}
                    {day.entries.length > 2 && (
                      <div className="text-[9px] text-slate-400 pl-1 font-semibold">
                        +{day.entries.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Hover hint: icon inline with text, centered */}
                  <div className="hidden group-hover:flex items-center justify-center gap-1 text-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold pt-1 w-full">
                    <Plus className="size-3 shrink-0" />
                    <span>Add Time Entry</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ============ TABLE VIEW ============ */
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                  <TableHead className="w-28 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Date
                  </TableHead>
                  <TableHead className="w-36 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Hours Worked
                  </TableHead>
                  <TableHead className="min-w-48 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Project Name
                  </TableHead>
                  <TableHead className="w-40 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Task
                  </TableHead>
                  <TableHead className="w-36 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Tag / Sprint
                  </TableHead>
                  <TableHead className="min-w-44 text-xs font-bold text-slate-700 dark:text-slate-200">
                    Task Detail
                  </TableHead>
                  <TableHead className="w-28 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Status
                  </TableHead>
                  <TableHead className="w-20 text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-xs text-slate-500">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Clock className="size-8 text-slate-300" />
                        <p className="font-semibold text-slate-700 dark:text-slate-300">
                          No timesheet records found for this period
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Click &quot;Add Time Entry&quot; above to log your workday or timeoff.
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  userEntries.map((item) => {
                    const isEditable = item.timesheet_status === "Waiting";
                    return (
                      <TableRow
                        key={item.timesheet_id}
                        onClick={() => setSelectedDetailEntry(item)}
                        className="cursor-pointer hover:bg-emerald-50/40 dark:hover:bg-slate-800/50 transition-colors"
                      >
                        <TableCell className="font-medium text-xs text-slate-900 dark:text-slate-100">
                          {item.date}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {item.start_time} - {item.finish_time}
                            </span>
                            <span className="ml-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              ({item.man_hour.toFixed(2)}h)
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          <div>
                            <span>{item.project_name}</span>
                            <span className="block text-[10px] font-mono text-slate-400">
                              [{item.project_code}]
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-slate-700 dark:text-slate-300">
                          <span>{item.task}</span>
                          {item.leave === 1 && (
                            <span className="ml-1 text-[10px] text-amber-600 font-semibold">(half day)</span>
                          )}
                          {item.leave === 2 && (
                            <span className="ml-1 text-[10px] text-amber-600 font-semibold">(full day)</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-400">
                          {item.tag_name ? (
                            <Badge variant="outline" className="text-[10px] font-medium border-slate-300">
                              {item.tag_name}
                            </Badge>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                          <Tooltip>
                            <TooltipTrigger
                              render={
                                <span className="block truncate">{item.detail}</span>
                              }
                            />
                            <TooltipContent className="max-w-xs text-xs">
                              {item.detail}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>
                        <TableCell className="text-center">
                          {item.timesheet_status === "Approve" ? (
                            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 text-[10px] font-semibold dark:bg-emerald-950 dark:text-emerald-300">
                              Approve
                            </Badge>
                          ) : item.timesheet_status === "Reject" ? (
                            <Badge className="bg-rose-100 text-rose-800 border-rose-300 text-[10px] font-semibold dark:bg-rose-950 dark:text-rose-300">
                              Reject
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] font-semibold dark:bg-amber-950 dark:text-amber-300">
                              Waiting
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => setSelectedDetailEntry(item)}
                              title="View Details"
                              className="p-1 text-slate-400 hover:text-emerald-700"
                            >
                              <Eye className="size-3.5" />
                            </button>
                            {isEditable ? (
                              <>
                                <button
                                  onClick={() => handleEdit(item)}
                                  title="Edit Entry"
                                  className="p-1 text-slate-400 hover:text-blue-600"
                                >
                                  <Edit className="size-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.timesheet_id)}
                                  title="Delete Entry"
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-300">Locked</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2.5 text-xs text-slate-500 dark:border-slate-800">
            <span>Showing {userEntries.length} entries</span>
            <span>Month total: <strong className="text-slate-800 dark:text-slate-200">{summary.totalHours.toFixed(1)} hrs</strong></span>
          </div>
        </div>
      )}

      {/* Summary KPI Cards (Rendered only when month has logged entries) */}
      {userEntries.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 pt-1">
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Worked
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {summary.totalHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400">hrs</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              {summary.workingDays} active days logged
            </p>
          </div>

          <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-3.5 shadow-2xs dark:border-emerald-900/50 dark:bg-emerald-950/20">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider dark:text-emerald-400">
              Approved
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                {summary.approvedHours.toFixed(1)}
              </span>
              <span className="text-xs text-emerald-600/70">hrs</span>
            </div>
            <p className="mt-1 text-[11px] text-emerald-700/80 dark:text-emerald-400">
              Supervisor confirmed
            </p>
          </div>

          <div className="rounded-xl border border-amber-100 bg-amber-50/40 p-3.5 shadow-2xs dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider dark:text-amber-400">
              Waiting Approval
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-amber-700 dark:text-amber-300">
                {summary.waitingHours.toFixed(1)}
              </span>
              <span className="text-xs text-amber-600/70">hrs</span>
            </div>
            <p className="mt-1 text-[11px] text-amber-700/80 dark:text-amber-400">
              Under manager review
            </p>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Leave Taken
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                {summary.leaveDays}
              </span>
              <span className="text-xs text-slate-400">days</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Annual &amp; sick leave</p>
          </div>

          <div className="col-span-2 sm:col-span-1 rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Rejected
            </p>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                {summary.rejectedHours.toFixed(1)}
              </span>
              <span className="text-xs text-rose-400">hrs</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">Requires correction</p>
          </div>
        </div>
      )}

      {/* Add / Edit Dialog */}
      <AddTimeEntryDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        editEntry={editingEntry}
        initialDate={prefilledDate}
      />

      {/* Timesheet Detail Dialog */}
      <TimesheetDetailDialog
        entry={selectedDetailEntry}
        open={!!selectedDetailEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedDetailEntry(null);
        }}
        onEdit={(entry) => handleEdit(entry)}
        onDelete={(id) => handleDelete(id)}
      />
    </div>
  );
};
