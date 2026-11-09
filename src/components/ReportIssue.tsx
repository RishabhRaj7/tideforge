"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

export function ReportIssue({ kind = "data-error", label = "Report an error" }: { kind?: "data-error" | "calc-mismatch" | "suggestion"; label?: string }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function send() {
    setState("sending");
    try {
      const r = await fetch("/api/v1/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, page: path, message: msg }) });
      setState(r.ok ? "done" : "error");
      if (r.ok) setMsg("");
    } catch {
      setState("error");
    }
  }
  return (
    <div className="inline-block">
      <button className="chip" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        ⚑ {label}
      </button>
      {open && (
        <div className="glass mt-2 w-full max-w-sm rounded p-3 sm:w-96">
          {state === "done" ? (
            <p className="text-[13px] text-ok">Thanks. We will review it against the game data.</p>
          ) : (
            <>
              <label className="label mb-1 block" htmlFor="report-msg">What looks wrong?</label>
              <textarea id="report-msg" value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className="w-full" placeholder="e.g. Skill multiplier at level 10 should be 123.4%" />
              <div className="mt-2 flex items-center gap-2">
                <button className="btn btn-primary" disabled={msg.trim().length < 5 || state === "sending"} onClick={send}>
                  {state === "sending" ? "Sending…" : "Send report"}
                </button>
                {state === "error" && <span className="text-[12px] text-bad">Could not send. Try again.</span>}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
