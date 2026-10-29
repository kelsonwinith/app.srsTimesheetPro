"use client";

import React, { useState } from "react";
import { useTimesheet } from "@/context/TimesheetContext";
import { Project, Customer, ProjectStatus } from "@/types/timesheet";
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
  FolderGit2,
  Building,
  Search,
  Filter,
  Users,
  Briefcase,
  CheckCircle,
  Tag,
  ExternalLink,
} from "lucide-react";

export const ProjectManagementView: React.FC = () => {
  const { projects, customers } = useTimesheet();
  const [activeTab, setActiveTab] = useState<"projects" | "customers">("projects");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const filteredProjects = projects.filter((p) => {
    if (statusFilter !== "ALL" && p.project_status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.project_name.toLowerCase().includes(q);
      const matchCode = p.project_code.toLowerCase().includes(q);
      const matchCustomer = p.customer_name.toLowerCase().includes(q);
      if (!matchName && !matchCode && !matchCustomer) return false;
    }
    return true;
  });

  const filteredCustomers = customers.filter((c) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        c.customer_name.toLowerCase().includes(q) ||
        c.customer_code.toLowerCase().includes(q) ||
        c.contact_person.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const getStatusBadge = (status: ProjectStatus) => {
    switch (status) {
      case "Implement":
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300">Implement</Badge>;
      case "Warranty":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Warranty</Badge>;
      case "Maintenance":
        return <Badge className="bg-purple-100 text-purple-800 border-purple-300">Maintenance</Badge>;
      case "Presales":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-300">Presales</Badge>;
      case "Closed":
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <FolderGit2 className="size-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
              Project & Resource Hub
            </h1>
            <p className="text-xs text-slate-500">
              Manage client delivery projects, manday budgets, and tags.
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-1 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={() => setActiveTab("projects")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "projects"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Briefcase className="size-3.5" />
            <span>Projects ({projects.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("customers")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
              activeTab === "customers"
                ? "bg-emerald-50 text-emerald-800 shadow-2xs dark:bg-emerald-950 dark:text-emerald-300"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            <Building className="size-3.5" />
            <span>Customers ({customers.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-slate-900">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={
              activeTab === "projects"
                ? "Search project name, code, customer..."
                : "Search customer name, contact..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 text-xs bg-slate-50 dark:bg-slate-800"
          />
        </div>

        {activeTab === "projects" && (
          <div className="flex items-center gap-1">
            {["ALL", "Implement", "Warranty", "Maintenance", "Presales"].map((st) => (
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
        )}
      </div>

      {activeTab === "projects" ? (
        /* Projects Grid / Table */
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filteredProjects.length === 0 ? (
            <div className="col-span-full py-16 text-center text-xs text-slate-500 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
              <FolderGit2 className="size-8 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No projects available</p>
              <p className="text-[11px] text-slate-400 mt-1">
                Connect your Bearer Token via &quot;API Auth&quot; to fetch your active projects from the Sirisoft backend.
              </p>
            </div>
          ) : (
            filteredProjects.map((p) => {
              const utilizationPct = p.allocated_mandays > 0
                ? Math.min(100, Math.round((p.used_mandays / p.allocated_mandays) * 100))
                : 0;
              return (
              <div
                key={p.project_id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-2xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {p.project_code}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        {p.project_name}
                      </h3>
                      <p className="text-xs text-slate-500">{p.customer_name}</p>
                    </div>
                    {getStatusBadge(p.project_status)}
                  </div>

                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {p.description}
                  </p>
                </div>

                {/* Manday Progress Bar */}
                <div className="space-y-1 rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Manday Utilization</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {p.used_mandays} / {p.allocated_mandays} MD ({utilizationPct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-full rounded-full transition-all ${
                        utilizationPct > 90
                          ? "bg-rose-500"
                          : utilizationPct > 70
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                      }`}
                      style={{ width: `${utilizationPct}%` }}
                    />
                  </div>
                </div>

                {/* Tags / Sprints preview */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex flex-wrap gap-1">
                    {p.tags.slice(0, 2).map((tg) => (
                      <Badge
                        key={tg.tag_timesheet_id}
                        variant="outline"
                        className="text-[10px] border-slate-200 text-slate-600"
                      >
                        {tg.tag_name}
                      </Badge>
                    ))}
                    {p.tags.length > 2 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{p.tags.length - 2} more
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">PM: {p.manager_name}</span>
                </div>
              </div>
            );
          }))}
        </div>
      ) : (
        /* Customers Table */
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden dark:border-slate-800 dark:bg-slate-900">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-800/60">
                <TableHead className="w-28 text-xs font-bold text-slate-700 dark:text-slate-200">
                  Code
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Customer / Enterprise Name
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Primary Contact
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Email
                </TableHead>
                <TableHead className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  Phone
                </TableHead>
                <TableHead className="text-center text-xs font-bold text-slate-700 dark:text-slate-200">
                  Active Projects
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-xs text-slate-500">
                    No customer directory records loaded.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((c) => (
                  <TableRow key={c.customer_id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <TableCell className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {c.customer_code}
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {c.customer_name}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {c.contact_person}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {c.email}
                    </TableCell>
                    <TableCell className="text-xs text-slate-600 dark:text-slate-300">
                      {c.phone}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-bold">
                        {c.active_projects_count}
                      </Badge>
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
