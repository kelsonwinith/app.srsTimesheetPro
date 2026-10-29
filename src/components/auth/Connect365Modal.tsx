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
} from "lucide-react";

interface Connect365ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const Connect365Modal: React.FC<Connect365ModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { setApiCredentials, isSyncingApi, apiSyncError } = useTimesheet();
  const [tab, setTab] = useState<"bookmarklet" | "manual">("bookmarklet");
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

  const bookmarkletCode = useMemo(() => {
    return `javascript:(async function(){try{function d(s){try{var b=s.replace(/-/g,"+").replace(/_/g,"/");while(b.length%4)b+="=";return JSON.parse(decodeURIComponent(escape(atob(b))));}catch(e){return null;}}var list=[],eid="",prof=null;function scan(st){try{for(var i=0;i<st.length;i++){var k=st.key(i);if(!k)continue;var v=st.getItem(k);if(!v)continue;var lk=k.toLowerCase();if(lk==="employeeid"||lk==="empid"){eid=v.replace(/^"|"$/g,"");}if(lk==="userprofile"||lk==="user"||lk==="profile"){try{var u=JSON.parse(v);if(u&&typeof u==="object"){prof=u;if(u.employeeId)eid=String(u.employeeId);else if(u.empId)eid=String(u.empId);}}catch(e){}}var raw="",target="",exp=0;if(lk.includes("accesstoken")||v.startsWith("{\\"homeAccountId")||(v.startsWith("eyJ")&&v.split(".").length===3)){try{var o=JSON.parse(v);if(o&&o.secret){raw=o.secret;target=(o.target||"").toLowerCase();exp=Number(o.expiresOn||0);}}catch(e){if(v.startsWith("eyJ")&&v.split(".").length===3){raw=v.replace(/^"|"$/g,"");}}}if(raw&&raw.startsWith("eyJ")&&raw.split(".").length===3){var payload=d(raw.split(".")[1]);if(payload){var aud=(payload.aud||"").toLowerCase();var scp=(payload.scp||payload.roles||"").toString().toLowerCase();var expSec=payload.exp||exp;var isGraph=aud.includes("00000003-0000-0000-c000")||(scp.includes("user.read")&&!scp.includes("kong"));var isKong=scp.includes("kong")||target.includes("kong");var expired=expSec&&expSec<(Date.now()/1000);list.push({tok:raw,isKong:isKong&&!isGraph,isGraph:isGraph,expired:expired,exp:expSec});}}}}catch(e){}}scan(localStorage);scan(sessionStorage);list.sort(function(a,b){if(a.isKong&&!b.isKong)return-1;if(!a.isKong&&b.isKong)return 1;if(!a.expired&&b.expired)return-1;if(a.expired&&!b.expired)return 1;return(b.exp||0)-(a.exp||0);});var chosen=null;for(var j=0;j<list.length;j++){var item=list[j];if(item.isGraph)continue;try{var res=await fetch("https://backend.timesheet.sirisoft.co.th/api/timesheet-service/config/timesheet",{headers:{"Authorization":"Bearer "+item.tok}});if(res.status===200){chosen=item.tok;break;}}catch(e){if(item.isKong&&!item.expired){chosen=item.tok;break;}}}if(!chosen&&list.length>0&&list[0].isKong&&list[0].expired){if(confirm("Your session on timesheet.sirisoft.co.th has expired (Invalid signature).\\n\\nClick OK to refresh this page and renew your session, then click Sync Timesheet again!")){window.location.reload();}return;}if(!chosen&&list.length>0&&list[0].isKong){chosen=list[0].tok;}if(!chosen){alert("Could not find active Kong backend session.\\n\\nPlease make sure you are logged in on timesheet.sirisoft.co.th and refresh the page (press F5 or Cmd+R), then click Sync Timesheet again!");return;}var parts=["token="+encodeURIComponent(chosen)];if(eid)parts.push("empId="+encodeURIComponent(eid));if(prof)parts.push("profile="+encodeURIComponent(JSON.stringify(prof)));var dest="${clientOrigin}#"+parts.join("&");var w=window.open(dest,"_blank");if(!w||w.closed||typeof w.closed==="undefined"){window.location.href=dest;}}catch(err){alert("Sync Timesheet error: "+err.message);}})();`;
  }, [clientOrigin]);

  const handleCopy = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopiedBookmarklet(true);
    toast.success("Copied 'Sync Timesheet' bookmarklet URL to clipboard!");
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

    setManualSubmitting(true);
    const success = await setApiCredentials(cleanToken, manualEmpId.trim());
    setManualSubmitting(false);

    if (success) {
      toast.success("Successfully authenticated and synced with Sirisoft backend!");
      onOpenChange(false);
    } else {
      setManualError(apiSyncError || "Authentication failed (401). Please check the token signature.");
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
          </div>
          <DialogDescription className="text-xs">
            Authenticate safely with Sirisoft timesheet backend to fetch your projects, sprints, and logged hours.
          </DialogDescription>
        </DialogHeader>

        {/* Tab Switcher */}
        <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setTab("bookmarklet")}
            className={`flex-1 py-1.5 rounded-md transition ${
              tab === "bookmarklet"
                ? "bg-white text-emerald-800 shadow-2xs dark:bg-slate-900 dark:text-emerald-300 font-bold"
                : "text-slate-500 hover:text-slate-900 dark:text-slate-400"
            }`}
          >
            ⚡ 1-Click Bookmarklet (Recommended)
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
            🔑 Paste Token Directly
          </button>
        </div>

        {/* Invalid Signature Note Alert */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-[11px] text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-300">
          <div className="flex items-start gap-2">
            <HelpCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-bold">Got &quot;Invalid signature&quot; (401)?</span>
              <p className="text-slate-600 dark:text-slate-300 leading-normal">
                Azure AD tokens expire after 1 hour. Simply open{" "}
                <a
                  href="https://timesheet.sirisoft.co.th/timesheet"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-emerald-700 underline"
                >
                  timesheet.sirisoft.co.th/timesheet
                </a>
                , press <kbd className="px-1 rounded bg-white border font-mono">F5</kbd> /{" "}
                <kbd className="px-1 rounded bg-white border font-mono">Cmd+R</kbd> to renew your session, then click <strong>Sync Timesheet</strong>!
              </p>
            </div>
          </div>
        </div>

        {tab === "bookmarklet" ? (
          <div className="space-y-3.5 py-1 text-xs">
            {/* Main Bookmarklet Action Card */}
            <div className="rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/80 p-4 space-y-3 dark:border-emerald-800 dark:bg-emerald-950/40">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bookmark className="size-4 text-emerald-700 dark:text-emerald-400" />
                  <span className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                    Bookmarklet: Sync Timesheet
                  </span>
                </div>
                <Badge className="bg-emerald-700 text-white text-[10px] px-2 py-0.5 font-bold">
                  Auto Verified
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
                  onClick={handleCopy}
                  className="h-9 text-xs gap-1.5 border-emerald-300 text-emerald-800 hover:bg-emerald-100 dark:text-emerald-300 font-semibold"
                >
                  {copiedBookmarklet ? (
                    <Check className="size-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="size-3.5" />
                  )}
                  <span>{copiedBookmarklet ? "Copied URL!" : "Copy Sync Timesheet"}</span>
                </Button>
              </div>
            </div>

            {/* 3 Simple Steps */}
            <div className="rounded-xl border border-slate-200 bg-white p-3.5 space-y-2 dark:border-slate-800 dark:bg-slate-900">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
                How it works (Zero Manual Typing):
              </h4>
              <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-decimal list-inside">
                <li>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Drag the button above
                  </span>{" "}
                  to your browser Bookmarks Bar (<kbd className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[10px] dark:bg-slate-800">Cmd+Shift+B</kbd>).
                </li>
                <li>
                  Go to{" "}
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
                  </span>
                  . It verifies the backend token live and imports your session.
                </li>
              </ol>
            </div>
          </div>
        ) : (
          /* Manual Token Input Tab */
          <form onSubmit={handleManualSubmit} className="space-y-3.5 py-1 text-xs">
            {manualError && (
              <Alert variant="destructive" className="py-2 text-xs">
                <AlertTriangle className="size-4" />
                <AlertDescription className="font-semibold">{manualError}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bearer Token (from DevTools Network request to /api/timesheet-service/*)
              </Label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIs..."
                rows={4}
                className="w-full rounded-lg border border-slate-200 p-2 text-xs font-mono dark:border-slate-800 dark:bg-slate-900 focus:outline-emerald-600"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Employee ID (e.g. 663)
              </Label>
              <Input
                type="text"
                value={manualEmpId}
                onChange={(e) => setManualEmpId(e.target.value)}
                placeholder="663"
                className="h-8 text-xs font-mono"
              />
            </div>

            <Button
              type="submit"
              disabled={manualSubmitting}
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
