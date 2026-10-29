"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
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
} from "lucide-react";

interface Connect365ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Connect365Modal: React.FC<Connect365ModalProps> = ({
  open,
  onOpenChange,
}) => {
  const [copiedBookmarklet, setCopiedBookmarklet] = useState(false);
  const [clientOrigin, setClientOrigin] = useState("http://localhost:3000");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setClientOrigin(window.location.origin);
    }
  }, []);

  const bookmarkletCode = useMemo(() => {
    return `javascript:(function(){try{let kt='',gt='',ft='',eid='',p=null;function scan(st){try{for(let i=0;i<st.length;i++){const k=st.key(i);if(!k)continue;const v=st.getItem(k);if(!v)continue;const lk=k.toLowerCase();if(lk.includes('accesstoken')){try{const o=JSON.parse(v);if(o&&o.secret){const tg=(o.target||'').toLowerCase();if(tg.includes('kong')||tg.includes('backend')||tg.includes('d6a5eecc')){kt=o.secret;}else if(!gt){gt=o.secret;}}}catch(x){}}if(!ft&&v.startsWith('eyJ')&&v.split('.').length===3){ft=v.replace(/^"|"$/g,'');}if(lk==='employeeid'||lk==='empid'){eid=v.replace(/^"|"$/g,'');}if(lk==='userprofile'||lk==='user'){try{const u=JSON.parse(v);if(u&&typeof u==='object'){p=u;if(u.employeeId)eid=String(u.employeeId);else if(u.empId)eid=String(u.empId);else if(u.id)eid=String(u.id);}}catch(x){}}}}catch(x){}}scan(localStorage);scan(sessionStorage);const tok=kt||gt||ft;if(!tok&&!p){alert('Could not find active Sirisoft session. Please ensure you are logged in on timesheet.sirisoft.co.th!');return;}const parts=[];if(tok)parts.push('token='+encodeURIComponent(tok));if(eid)parts.push('empId='+encodeURIComponent(eid));if(p)parts.push('profile='+encodeURIComponent(JSON.stringify(p)));const targetUrl='${clientOrigin}#'+parts.join('&');const w=window.open(targetUrl,'_blank');if(!w||w.closed||typeof w.closed==='undefined'){window.location.href=targetUrl;}}catch(err){alert('Connecting Timesheet error: '+err.message);}})();`;
  }, [clientOrigin]);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    toast.success("Copied 'Connecting Timesheet' bookmarklet URL to clipboard!");
    setTimeout(() => setCopiedBookmarklet(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 text-base font-bold">
            <Sparkles className="size-4 text-emerald-600" />
            Connecting Timesheet
          </DialogTitle>
          <DialogDescription className="text-xs">
            1-Click Bookmarklet syncs your active session directly from <code>timesheet.sirisoft.co.th</code> with zero manual typing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Main Bookmarklet Action Card */}
          <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4 space-y-3 dark:border-emerald-800 dark:bg-emerald-950/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bookmark className="size-4 text-emerald-700 dark:text-emerald-400" />
                <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                  Bookmarklet: Connecting Timesheet
                </span>
              </div>
              <Badge className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 font-bold">
                Default
              </Badge>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong>Drag this button</strong> directly onto your browser Bookmarks Bar:
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <a
                href={bookmarkletCode}
                title="Connecting Timesheet"
                onClick={(e) => {
                  alert(
                    "Drag this 'Connecting Timesheet' button to your Bookmarks Bar (press Cmd+Shift+B or Ctrl+Shift+B to display your bookmarks bar). Then click it whenever you are on timesheet.sirisoft.co.th!"
                  );
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-800 cursor-grab active:cursor-grabbing transition"
              >
                <Sparkles className="size-4" />
                <span>⚡ Connecting Timesheet</span>
              </a>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="h-9 text-xs gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 font-semibold"
              >
                {copiedBookmarklet ? (
                  <Check className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5" />
                )}
                <span>{copiedBookmarklet ? "Copied URL!" : "Copy Connecting Timesheet"}</span>
              </Button>
            </div>
          </div>

          {/* 3 Simple Steps */}
          <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              How it works (Zero Manual Typing):
            </h4>
            <ol className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Drag the &quot;Connecting Timesheet&quot; button above
                </span>{" "}
                to your browser Bookmarks Bar (<kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Cmd+Shift+B</kbd>).
              </li>
              <li>
                Open{" "}
                <a
                  href="https://timesheet.sirisoft.co.th"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-emerald-700 underline inline-flex items-center gap-0.5"
                >
                  timesheet.sirisoft.co.th
                  <ExternalLink className="size-3" />
                </a>{" "}
                where you are logged in.
              </li>
              <li>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  Click the &quot;Connecting Timesheet&quot; bookmark
                </span>
                . Your session transfers securely via local hash and instantly connects your account.
              </li>
            </ol>
          </div>

          {/* Safety Guarantee */}
          <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                Strict Read-Only &amp; Zero Remote Writes
              </span>
              <p className="text-slate-500 dark:text-slate-400">
                Your Bearer Token is used exclusively to fetch projects and sprints via safe HTTP <code>GET</code>. Remote POST/PUT/DELETE operations remain completely blocked.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
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
