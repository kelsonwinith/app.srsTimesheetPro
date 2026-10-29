"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { useTimesheet } from "@/context/TimesheetContext";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sparkles,
  Bookmark,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Key,
  RefreshCw,
  AlertTriangle,
  HelpCircle,
  Terminal,
  LogOut,
  CheckCircle2,
} from "lucide-react";
import { inspectJwt, JwtInspectionResult } from "@/utils/jwtUtils";

interface Connect365ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Connect365Modal: React.FC<Connect365ModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    setApiCredentials,
    clearApiCredentials,
    isRealApiConnected,
    apiToken,
    apiEmployeeId,
    currentUser,
    isSyncingApi,
    apiSyncError,
  } = useTimesheet();

  const [tab, setTab] = useState<"devtools" | "bookmarklet" | "manual">("devtools");
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [clientOrigin, setClientOrigin] = useState("http://localhost:3000");

  // Manual inputs
  const [manualToken, setManualToken] = useState("");
  const [manualEmpId, setManualEmpId] = useState("");
  const [manualSubmitting, setManualSubmitting] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientOrigin(window.location.origin);
    }
  }, []);

  // Live JWT Inspection for manual input
  const tokenInspection: JwtInspectionResult | null = useMemo(() => {
    if (!manualToken.trim()) return null;
    return inspectJwt(manualToken);
  }, [manualToken]);

  // DevTools 1-liner snippet
  const devToolsSnippet = useMemo(() => {
    return `(function(){try{var t=null,e=localStorage.getItem("employeeId")||"",p=localStorage.getItem("userProfile")||"";for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i)||"",v=localStorage.getItem(k)||"";if(k.toLowerCase().includes("accesstoken")||v.indexOf("secret")!==-1){try{var o=JSON.parse(v);if(o&&o.secret&&o.target&&o.target.toLowerCase().indexOf("kong")!==-1){t=o.secret;break;}}catch(err){}}}if(!t){for(var j=0;j<sessionStorage.length;j++){var sk=sessionStorage.key(j)||"",sv=sessionStorage.getItem(sk)||"";if(sk.toLowerCase().includes("accesstoken")||sv.indexOf("secret")!==-1){try{var so=JSON.parse(sv);if(so&&so.secret&&so.target&&so.target.toLowerCase().indexOf("kong")!==-1){t=so.secret;break;}}catch(err){}}}}if(!t){alert("Active Kong token not found in storage.\\n\\nPlease refresh timesheet.sirisoft.co.th (Cmd+R or F5) while logged in and run again!");return;}var u="${clientOrigin}/#token="+encodeURIComponent(t)+(e?"&empId="+encodeURIComponent(e):"")+(p?"&profile="+encodeURIComponent(p):"");var w=window.open(u,"_blank");if(!w||w.closed){window.location.href=u;}}catch(e){alert("Error: "+e.message);}})();`;
  }, [clientOrigin]);

  // Synchronous bookmarklet (no async/await, void return)
  const bookmarkletCode = useMemo(() => {
    return `javascript:void(function(){try{var t=null,e=localStorage.getItem("employeeId")||"",p=localStorage.getItem("userProfile")||"";for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i)||"",v=localStorage.getItem(k)||"";if(k.toLowerCase().includes("accesstoken")||v.indexOf("secret")!==-1){try{var o=JSON.parse(v);if(o&&o.secret&&o.target&&o.target.toLowerCase().indexOf("kong")!==-1){t=o.secret;break;}}catch(err){}}}if(!t){for(var j=0;j<sessionStorage.length;j++){var sk=sessionStorage.key(j)||"",sv=sessionStorage.getItem(sk)||"";if(sk.toLowerCase().includes("accesstoken")||sv.indexOf("secret")!==-1){try{var so=JSON.parse(sv);if(so&&so.secret&&so.target&&so.target.toLowerCase().indexOf("kong")!==-1){t=so.secret;break;}}catch(err){}}}}if(!t){alert("Kong token not found.\\n\\nPlease refresh timesheet.sirisoft.co.th (Cmd+R or F5) and click again!");return;}var u="${clientOrigin}/#token="+encodeURIComponent(t)+(e?"&empId="+encodeURIComponent(e):"")+(p?"&profile="+encodeURIComponent(p):"");var w=window.open(u,"_blank");if(!w||w.closed){window.location.href=u;}}catch(e){alert("Error: "+e.message);}})();`;
  }, [clientOrigin]);

  const handleCopySnippet = () => {
    navigator.clipboard.writeText(devToolsSnippet);
    setCopiedSnippet(true);
    toast.success("Copied 1-line script to clipboard!");
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    toast.success("Copied bookmarklet to clipboard!");
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setManualError(null);

    const cleanToken = manualToken.trim().replace(/^Bearer\s+/i, "").replace(/^"|"$/g, "");
    if (!cleanToken) {
      setManualError("Please enter a Bearer Token.");
      return;
    }

    if (tokenInspection?.tokenType === "MS_GRAPH") {
      setManualError("This is a Microsoft Graph token (user.read). Kong Gateway will reject it with 'Invalid signature'. Please provide the Kong token.");
      return;
    }

    setManualSubmitting(true);
    const success = await setApiCredentials(cleanToken, manualEmpId.trim());
    setManualSubmitting(false);

    if (success) {
      toast.success("Successfully authenticated and synced with Sirisoft backend!");
      onOpenChange(false);
    } else {
      setManualError(apiSyncError || "Authentication failed (401 Invalid signature). Please verify token.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-base font-bold">
              <Sparkles className="size-4 text-emerald-600" />
              Sync Timesheet Session
            </DialogTitle>
            {isRealApiConnected && (
              <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-2 py-0.5">
                <CheckCircle2 className="size-3" />
                Connected (Emp #{currentUser.employeeId || apiEmployeeId})
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs">
            Authenticate safely with Sirisoft timesheet backend to fetch your projects, sprints, and logged hours.
          </DialogDescription>
        </DialogHeader>

        {/* Connection Status Banner (if connected) */}
        {isRealApiConnected && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-900 dark:text-emerald-300">
                Active Session: {currentUser.displayName || "Employee"} (ID: {currentUser.employeeId || apiEmployeeId || "Unknown"})
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Connected to backend.timesheet.sirisoft.co.th (GET requests active).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearApiCredentials}
              className="h-7 text-xs border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:text-rose-400 font-semibold gap-1"
            >
              <LogOut className="size-3" />
              Disconnect
            </Button>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("devtools")}
            className={`flex-1 py-1.5 rounded-md transition ${
              tab === "devtools"
                ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            ⚡ Console 1-Liner (Fastest)
          </button>
          <button
            type="button"
            onClick={() => setTab("bookmarklet")}
            className={`flex-1 py-1.5 rounded-md transition ${
              tab === "bookmarklet"
                ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            🔖 Bookmarklet
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex-1 py-1.5 rounded-md transition ${
              tab === "manual"
                ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            🔑 Paste Token
          </button>
        </div>

        {/* Invalid Signature Note Alert */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <HelpCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Why does &quot;Invalid signature&quot; (401) happen?</span>
              <p className="text-slate-600 dark:text-slate-300 leading-normal">
                Sirisoft uses Kong Gateway with Azure AD JWT verification. Kong only accepts the access token with scope <code>d6a5eecc-b482-4539-a823-15867c6e8b3f/kong</code>. If you use Microsoft Graph (<code>user.read</code>) or an expired token, Kong responds with <strong>Invalid signature</strong>.
              </p>
            </div>
          </div>
        </div>

        {tab === "devtools" && (
          <div className="space-y-3 py-1 text-xs">
            <div className="rounded-2xl border-2 border-emerald-300 bg-emerald-50/60 p-4 space-y-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-950 dark:text-emerald-200">
                  <Terminal className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span>DevTools Console 1-Liner (100% Reliable)</span>
                </div>
                <Badge className="bg-emerald-700 text-white text-[10px] font-bold">
                  Guaranteed Kong Token
                </Badge>
              </div>

              <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-xs">
                Copy this 1-line script and paste it into the DevTools Console on your active timesheet tab:
              </p>

              {/* Code Box */}
              <div className="relative rounded-lg bg-slate-900 p-2.5 font-mono text-[11px] text-emerald-300 overflow-x-auto shadow-inner border border-slate-800 max-h-24">
                <code>{devToolsSnippet}</code>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <Button
                  type="button"
                  onClick={handleCopySnippet}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold gap-1.5 h-8 px-4"
                >
                  {copiedSnippet ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                  <span>{copiedSnippet ? "Copied 1-Liner!" : "Copy 1-Line Script"}</span>
                </Button>

                <a
                  href="https://timesheet.sirisoft.co.th/timesheet"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                >
                  Open Timesheet
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>

            {/* Steps */}
            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">3 Quick Steps:</h4>
              <ol className="space-y-1 text-slate-600 dark:text-slate-300 list-decimal list-inside text-xs">
                <li>
                  Go to <a href="https://timesheet.sirisoft.co.th/timesheet" target="_blank" rel="noreferrer" className="underline font-semibold text-emerald-700">timesheet.sirisoft.co.th/timesheet</a>. If idle, refresh once (<kbd className="px-1 rounded bg-slate-100 border text-[10px]">Cmd+R</kbd> / <kbd className="px-1 rounded bg-slate-100 border text-[10px]">F5</kbd>).
                </li>
                <li>
                  Press <kbd className="px-1 rounded bg-slate-100 border text-[10px]">F12</kbd> (or Right Click → <strong>Inspect</strong>) and click the <strong>Console</strong> tab.
                </li>
                <li>
                  Paste the copied 1-liner and press <kbd className="px-1 rounded bg-slate-100 border text-[10px]">Enter</kbd>. It immediately launches this app with your real Kong token!
                </li>
              </ol>
            </div>
          </div>
        )}

        {tab === "bookmarklet" && (
          <div className="space-y-3.5 py-1 text-xs">
            <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4 space-y-3 dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                    Bookmarklet: Sync Timesheet
                  </span>
                </div>
                <Badge className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 font-bold">
                  Zero Typing
                </Badge>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong>Drag this button</strong> directly to your browser Bookmarks Bar:
              </p>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={bookmarkletCode}
                  title="Sync Timesheet"
                  onClick={(e) => {
                    alert(
                      "Drag this 'Sync Timesheet' button to your Bookmarks Bar (press Cmd+Shift+B or Ctrl+Shift+B to display your bookmarks bar). Then click it whenever you are on timesheet.sirisoft.co.th!"
                    );
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 cursor-grab active:cursor-grabbing transition"
                >
                  <Sparkles className="size-4" />
                  <span>⚡ Sync Timesheet</span>
                </a>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleCopyBookmarklet}
                  className="h-9 text-xs gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 font-semibold"
                >
                  {copiedBookmarklet ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copiedBookmarklet ? "Copied URL!" : "Copy Link"}</span>
                </Button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">How to use:</h4>
              <ol className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>Drag the green button to your bookmarks bar.</li>
                <li>Open <a href="https://timesheet.sirisoft.co.th/timesheet" target="_blank" rel="noreferrer" className="underline font-semibold text-emerald-700">timesheet.sirisoft.co.th/timesheet</a>.</li>
                <li>Click the bookmark. It synchronously reads the Kong token from storage and imports it here.</li>
              </ol>
            </div>
          </div>
        )}

        {tab === "manual" && (
          <form onSubmit={handleManualSubmit} className="space-y-3 py-1 text-xs">
            {manualError && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertTriangle className="size-4" />
                <AlertDescription className="font-semibold">{manualError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bearer Token (must have scope &quot;kong&quot;)
              </Label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs..."
                rows={3}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-900 focus:outline-emerald-600"
              />
            </div>

            {/* Real-time JWT Inspection Badge */}
            {tokenInspection && (
              <div
                className={`rounded-lg p-2.5 text-[11px] border ${
                  tokenInspection.tokenType === "KONG_BACKEND" && !tokenInspection.isExpired
                    ? "bg-emerald-50 border-emerald-200 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300"
                    : "bg-rose-50 border-rose-200 text-rose-900 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-300"
                }`}
              >
                <div className="font-bold flex items-center gap-1.5">
                  {tokenInspection.tokenType === "KONG_BACKEND" && !tokenInspection.isExpired ? (
                    <CheckCircle2 className="size-3.5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="size-3.5 text-rose-600" />
                  )}
                  <span>
                    Detected: {tokenInspection.tokenType === "KONG_BACKEND" ? "Valid Kong Backend Token" : tokenInspection.tokenType}
                  </span>
                </div>
                {tokenInspection.name && (
                  <div>User: <span className="font-semibold">{tokenInspection.name}</span> ({tokenInspection.preferred_username})</div>
                )}
                {tokenInspection.expiresAtFormatted && (
                  <div>Expires: <span className="font-semibold">{tokenInspection.expiresAtFormatted}</span> {tokenInspection.isExpired && "(EXPIRED)"}</div>
                )}
                {tokenInspection.warning && (
                  <p className="mt-1 font-semibold text-rose-700 dark:text-rose-400">
                    {tokenInspection.warning}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Employee ID (optional, auto-detected if left empty)
              </Label>
              <Input
                type="text"
                value={manualEmpId}
                onChange={(e) => setManualEmpId(e.target.value)}
                placeholder="Auto-detected from backend"
                className="h-8 text-xs font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={manualSubmitting || (tokenInspection?.tokenType === "MS_GRAPH")}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold h-9 gap-1.5"
            >
              {manualSubmitting ? (
                <RefreshCw className="size-3.5 animate-spin" />
              ) : (
                <Key className="size-3.5" />
              )}
              <span>{manualSubmitting ? "Validating with Backend..." : "Connect & Verify Token"}</span>
            </Button>
          </form>
        )}

        {/* Safety Notice */}
        <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 flex items-start gap-2">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-slate-500 dark:text-slate-400">
            Strict Read-Only Guarantee: Tokens are strictly used to read your timesheet and projects via HTTP <code>GET</code>. All remote mutations are blocked.
          </p>
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between w-full">
          {(apiToken || isRealApiConnected) ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clearApiCredentials}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400"
            >
              Clear Session
            </Button>
          ) : <div />}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs font-medium"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
