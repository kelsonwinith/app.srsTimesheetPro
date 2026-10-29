"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTimesheet } from "@/context/TimesheetContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  PlusCircle,
  CalendarDays,
  CheckCircle2,
  FolderGit2,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  Menu,
  RefreshCw,
  Lock,
  Sparkles,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Connect365Modal } from "@/components/auth/Connect365Modal";

interface AppNavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const AppNavbar: React.FC<AppNavbarProps> = ({ currentTab, onTabChange }) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    timesheets,
    auditLogs,
    refreshAuditLogs,
    lockConfig,
    isRealApiConnected,
    isSyncingApi,
  } = useTimesheet();

  const [safetyDialogOpen, setSafetyDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [connectModalOpen, setConnectModalOpen] = useState(false);

  const hasUser = Boolean(
    (currentUser && currentUser.employeeId && currentUser.employeeId !== 0) ||
    (currentUser && currentUser.displayName && currentUser.displayName !== "Timesheet User") ||
    isRealApiConnected
  );

  // Calculate pending approvals for the manager
  const pendingApprovalsCount = timesheets.filter((t) => t.timesheet_status === "Waiting").length;

  const navItems = [
    { id: "timesheet", label: "My Timesheet", icon: CalendarDays },
    {
      id: "approval",
      label: "Approvals",
      icon: CheckCircle2,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      visible: currentUser.menu.includes("approval"),
    },
    {
      id: "projects",
      label: "Projects",
      icon: FolderGit2,
      visible: currentUser.menu.includes("projectManagement"),
    },
    {
      id: "reports",
      label: "Reports",
      icon: BarChart3,
      visible: currentUser.menu.includes("report"),
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      visible: currentUser.menu.includes("setting") || currentUser.role === "Admin",
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/95 shadow-2xs">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo & Brand */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onTabChange("timesheet")}
              className="flex items-center gap-3 text-left focus:outline-hidden"
            >
              <div className="relative h-9 w-32 overflow-hidden">
                <Image
                  src="/assets/images/logo-home.png"
                  alt="Sirisoft Logo"
                  fill
                  sizes="128px"
                  className="object-contain object-left"
                  priority
                />
              </div>
              <div className="hidden border-l border-slate-200 pl-3 md:block dark:border-slate-700">
                <span className="text-xs font-bold tracking-tight text-emerald-800 dark:text-emerald-400">
                  Timesheet Pro
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems
                .filter((item) => item.visible !== false)
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = currentTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onTabChange(item.id)}
                      className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        isActive
                          ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold"
                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      <Icon className={`size-3.5 ${isActive ? "text-emerald-700 dark:text-emerald-400" : "text-slate-400"}`} />
                      <span>{item.label}</span>
                      {item.badge !== undefined && (
                        <Badge
                          variant="secondary"
                          className="ml-1 bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 px-1 py-0 text-[10px] font-bold"
                        >
                          {item.badge}
                        </Badge>
                      )}
                      {isActive && (
                        <span className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-emerald-600 dark:bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
            </nav>
          </div>

          {/* Right Controls: Safety Guard Status & User Switcher */}
          <div className="flex items-center gap-2">
            {/* Real API / Guard Status */}
            <button
              onClick={() => {
                refreshAuditLogs();
                setSafetyDialogOpen(true);
              }}
              title="Click to inspect safety guard"
              className="flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-medium text-slate-700 transition hover:bg-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
            >
              <div
                className={`size-2 rounded-full ${
                  isRealApiConnected ? "bg-emerald-500" : "bg-amber-400"
                }`}
              />
              <span className="hidden sm:inline">
                {isRealApiConnected ? "Real API: Active" : "R-Only Mode"}
              </span>
              <ShieldCheck className="size-3 text-emerald-600 ml-0.5" />
            </button>

            {/* User Switcher Dropdown OR Connecting 365 Button */}
            {hasUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 h-8 px-2.5 text-xs"
                    >
                      <div className="flex size-5 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                        {currentUser.givenName.substring(0, 2).toUpperCase()}
                      </div>
                      <span className="hidden sm:inline font-semibold text-slate-800 dark:text-slate-200">
                        {currentUser.displayName}
                      </span>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-slate-200">
                        {currentUser.role}
                      </Badge>
                      <ChevronDown className="size-3 text-slate-400" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2.5 py-2 flex flex-col space-y-0.5 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{currentUser.displayName}</p>
                    <p className="text-[11px] text-muted-foreground">{currentUser.mail}</p>
                  </div>
                  <div className="px-2.5 py-2 text-[11px] text-slate-500">
                    <span className="text-slate-400">Employee ID:</span>{" "}
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {currentUser.employeeId || "Not connected"}
                    </span>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setConnectModalOpen(true)}
                    className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold cursor-pointer"
                  >
                    <Sparkles className="size-3.5 mr-2 text-emerald-600" />
                    Re-sync Connecting Timesheet
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="default"
                size="sm"
                onClick={() => setConnectModalOpen(true)}
                className="h-8 gap-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold shadow-xs px-3"
              >
                {isSyncingApi ? (
                  <RefreshCw className="size-3.5 animate-spin" />
                ) : (
                  <Sparkles className="size-3.5" />
                )}
                <span>{isSyncingApi ? "Connecting Timesheet..." : "Connecting Timesheet"}</span>
              </Button>
            )}

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger
                render={
                  <Button variant="ghost" size="icon" className="md:hidden size-8">
                    <Menu className="size-4" />
                  </Button>
                }
              />
              <SheetContent side="right" className="w-64">
                <SheetHeader>
                  <SheetTitle className="text-left text-sm font-bold text-emerald-800 dark:text-emerald-400">
                    Sirisoft Timesheet
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-4 flex flex-col gap-1">
                  {navItems
                    .filter((item) => item.visible !== false)
                    .map((item) => {
                      const Icon = item.icon;
                      const isActive = currentTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            onTabChange(item.id);
                            setMobileMenuOpen(false);
                          }}
                          className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-900 font-bold dark:bg-emerald-950 dark:text-emerald-200"
                              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="size-4 text-emerald-700" />
                            <span>{item.label}</span>
                          </div>
                          {item.badge !== undefined && (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-900 text-[10px] font-bold">
                              {item.badge}
                            </Badge>
                          )}
                        </button>
                      );
                    })}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      {/* Safety Guard Audit & Details Modal */}
      <Dialog open={safetyDialogOpen} onOpenChange={setSafetyDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-base">
              <ShieldCheck className="size-5 text-emerald-600" />
              Backend Safety Guard Architecture
            </DialogTitle>
            <DialogDescription className="text-xs">
              Guarantee: Only HTTP GET (Read) operations are permitted to the backend. Any mutating
              operations (POST, PUT, DELETE, PATCH) are intercepted and prevented.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 text-xs">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 dark:border-emerald-800 dark:bg-emerald-950/40">
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                <Lock className="size-3.5 text-emerald-700 dark:text-emerald-400" />
                Active Safety Constraints
              </h4>
              <p className="mt-1 text-slate-700 dark:text-slate-300">
                All time entries added or edited are preserved locally in your browser session. No
                records on the real database will be created, modified, or deleted.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <h4 className="font-semibold text-slate-800 dark:text-slate-200">
                  Recent Safety Interceptor Audit Logs ({auditLogs.length})
                </h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refreshAuditLogs}
                  className="h-6 px-2 text-[11px] text-slate-600"
                >
                  <RefreshCw className="size-3 mr-1" />
                  Refresh
                </Button>
              </div>

              <div className="max-h-48 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-2 font-mono text-[10px]">
                {auditLogs.length === 0 ? (
                  <p className="text-slate-500 py-2 text-center">No audit logs recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className={`p-1.5 rounded border ${
                          log.status === "BLOCKED_MUTATION"
                            ? "bg-rose-50 border-rose-200 text-rose-800"
                            : "bg-white border-slate-200 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center justify-between font-bold">
                          <span>[{log.method}] {log.status}</span>
                          <span className="text-[9px] text-slate-400 font-normal">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="truncate text-slate-500">{log.url}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Connect Microsoft 365 Bookmarklet Modal */}
      <Connect365Modal open={connectModalOpen} onOpenChange={setConnectModalOpen} />
    </>
  );
};
