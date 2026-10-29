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
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Bookmark,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  LogOut,
  CheckCircle2,
} from "lucide-react";

interface Connect365ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Connect365Modal: React.FC<Connect365ModalProps> = ({
  open,
  onOpenChange,
}) => {
  const {
    clearApiCredentials,
    isRealApiConnected,
    apiToken,
    apiEmployeeId,
    currentUser,
  } = useTimesheet();

  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [clientOrigin, setClientOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientOrigin(window.location.origin);
    }
  }, []);

  // Synchronous, popup-blocker-safe bookmarklet targeting Kong token and extracting real profile image
  const bookmarkletCode = useMemo(() => {
    return `javascript:void(function(){try{var t=null,gt=null,e=localStorage.getItem("employeeId")||"",p=localStorage.getItem("userProfile")||"",ph="";for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i)||"",v=localStorage.getItem(k)||"";if(k.toLowerCase().includes("accesstoken")||v.indexOf("secret")!==-1){try{var o=JSON.parse(v);if(o&&o.secret&&o.target){var tg=o.target.toLowerCase();if(tg.indexOf("kong")!==-1)t=o.secret;else if(tg.indexOf("user.read")!==-1)gt=o.secret;}}catch(err){}}}if(!t){for(var j=0;j<sessionStorage.length;j++){var sk=sessionStorage.key(j)||"",sv=sessionStorage.getItem(sk)||"";if(sk.toLowerCase().includes("accesstoken")||sv.indexOf("secret")!==-1){try{var so=JSON.parse(sv);if(so&&so.secret&&so.target){var stg=so.target.toLowerCase();if(stg.indexOf("kong")!==-1)t=so.secret;else if(stg.indexOf("user.read")!==-1)gt=so.secret;}}catch(err){}}}}if(!t){alert("Kong token not found.\\n\\nPlease refresh timesheet.sirisoft.co.th (Cmd+R or F5) and click again!");return;}try{var img=document.querySelector(".nav-profile-img img, img[src*=\x27blob:\x27]");if(img&&img.src){var cvs=document.createElement("canvas");var w=img.naturalWidth||img.width||120,h=img.naturalHeight||img.height||120;cvs.width=w;cvs.height=h;var ctx=cvs.getContext("2d");ctx.drawImage(img,0,0,w,h);ph=cvs.toDataURL("image/jpeg",0.85);}}catch(e){}var u="${clientOrigin}/#token="+encodeURIComponent(t)+(e?"&empId="+encodeURIComponent(e):"")+(p?"&profile="+encodeURIComponent(p):"")+(gt?"&gtok="+encodeURIComponent(gt):"")+(ph?"&photo="+encodeURIComponent(ph):"");var w=window.open(u,"_blank");if(!w||w.closed){window.location.href=u;}}catch(e){alert("Error: "+e.message);}})();`;
  }, [clientOrigin]);

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    toast.success("Copied 'Sync Timesheet' bookmarklet URL to clipboard!");
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-base font-bold">
              <Sparkles className="size-4 text-emerald-600" />
              Sync Timesheet Session
            </DialogTitle>
            {isRealApiConnected && (
              <Badge className="bg-emerald-600 text-white text-[10px] gap-1 px-2 py-0.5 font-bold">
                <CheckCircle2 className="size-3" />
                Connected
              </Badge>
            )}
          </div>
          <DialogDescription className="text-xs">
            Authenticate with your Sirisoft account to load real projects, leaves, and logged timesheets.
          </DialogDescription>
        </DialogHeader>

        {/* Connection Status Banner (if connected) */}
        {isRealApiConnected && (
          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-xs dark:border-emerald-900/60 dark:bg-emerald-950/30">
            <div className="space-y-0.5">
              <div className="font-bold text-emerald-900 dark:text-emerald-300">
                Active: {currentUser.displayName || "Employee"} {currentUser.employeeId ? `(#${currentUser.employeeId})` : ""}
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

        {/* Main Bookmarklet Action Card */}
        <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4 space-y-3 dark:border-emerald-800 dark:bg-emerald-950/40 text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-emerald-700 dark:text-emerald-400" />
              <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                Bookmarklet: Sync Timesheet
              </span>
            </div>
            <Badge className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 font-bold">
              1-Click Sync
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
              <span>{copiedBookmarklet ? "Copied URL!" : "Copy Bookmarklet URL"}</span>
            </Button>
          </div>
        </div>

        {/* 3 Simple Steps */}
        <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900 text-xs">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
            How to use:
          </h4>
          <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
            <li>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Drag the button above
              </span>{" "}
              to your browser Bookmarks Bar (<kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Cmd+Shift+B</kbd> or <kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Ctrl+Shift+B</kbd>).
            </li>
            <li>
              Open{" "}
              <a
                href="https://timesheet.sirisoft.co.th/timesheet"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-emerald-700 underline inline-flex items-center gap-0.5"
              >
                timesheet.sirisoft.co.th/timesheet
                <ExternalLink className="size-3" />
              </a>.
            </li>
            <li>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Click the bookmark
              </span>{" "}
              while on that page. It securely grabs your active Kong backend session and redirects back here.
            </li>
          </ol>
        </div>

        {/* Session Expiry Note */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <HelpCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Session Expiry (401)</span>
              <p className="text-slate-600 dark:text-slate-300 leading-normal">
                If your session expires after 1 hour, simply refresh <a href="https://timesheet.sirisoft.co.th/timesheet" target="_blank" rel="noreferrer" className="underline font-bold text-emerald-700">timesheet.sirisoft.co.th</a> (<kbd className="px-1 rounded bg-white border font-mono">Cmd+R</kbd> / <kbd className="px-1 rounded bg-white border font-mono">F5</kbd>) and click the bookmark again.
              </p>
            </div>
          </div>
        </div>

        {/* Safety Notice */}
        <div className="rounded-xl bg-slate-50 p-2.5 text-[11px] text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 flex items-start gap-2">
          <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
          <p className="text-slate-500 dark:text-slate-400">
            Strict Read-Only Guarantee: The token is strictly used to read your timesheet and projects via HTTP <code>GET</code>. All remote mutations are blocked.
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
