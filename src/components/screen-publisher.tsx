"use client";

import { useActionState, useState } from "react";
import { CheckCircle2, FileImage, MonitorUp, ShieldCheck } from "lucide-react";
import { publishMedia, type PublishActionState } from "@/app/(portal)/screens/actions";

type MediaOption = { id: string; title: string; filename: string; mimeType: string; fileSize: number | null };

export function ScreenPublisher({ screenId, media, currentContentId }: { screenId: string; media: MediaOption[]; currentContentId: string | null }) {
  const [selected, setSelected] = useState(currentContentId ?? media[0]?.id ?? "");
  const initial: PublishActionState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(publishMedia, initial);

  return <form action={action} className="card overflow-hidden">
    <input type="hidden" name="screenId" value={screenId}/>
    <div className="border-b border-slate-100 p-5">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#b07822]">Step 2</p>
      <h2 className="mt-1 text-lg font-bold text-[#07172c]">Select approved media</h2>
      <p className="mt-1 text-sm text-slate-500">Choose the asset that should appear on {screenId}.</p>
    </div>
    <fieldset className="space-y-3 p-5">
      <legend className="sr-only">Approved media</legend>
      {media.map((item) => <label key={item.id} className={`flex cursor-pointer items-center gap-4 rounded-xl border p-4 transition ${selected === item.id ? "border-[#1a67d2] bg-blue-50 ring-1 ring-[#1a67d2]" : "border-slate-200 hover:border-slate-300"}`}>
        <input className="sr-only" type="radio" name="contentId" value={item.id} checked={selected === item.id} onChange={() => setSelected(item.id)}/>
        <span className="flex h-12 w-14 items-center justify-center rounded-lg bg-[#07172c] text-blue-200"><FileImage size={22}/></span>
        <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-[#07172c]">{item.filename}</strong><small className="mt-1 block text-xs text-slate-500">{item.title} · {item.mimeType}</small></span>
        {selected === item.id && <CheckCircle2 className="text-[#1a67d2]" size={21}/>} 
      </label>)}
      {media.length === 0 && <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">No approved player-compatible media is available. Apply the migration and seed first.</p>}
    </fieldset>
    <div className="mx-5 flex gap-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><ShieldCheck className="shrink-0 text-emerald-700" size={21}/><p><strong className="block text-slate-800">Safe publication</strong>The asset and configuration are validated, the previous valid file is backed up, and the replacement is atomic and audited.</p></div>
    {state.message && <p role={state.status === "error" ? "alert" : "status"} className={`mx-5 mt-4 rounded-lg p-3 text-sm ${state.status === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>{state.message}</p>}
    <div className="p-5"><button disabled={!selected || pending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1261c9] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#0c4fa8] disabled:cursor-not-allowed disabled:opacity-50"><MonitorUp size={18}/>{pending ? "Publishing safely…" : `Publish to ${screenId}`}</button><p className="mt-3 text-center text-xs text-slate-400">The player polls for updates approximately every 10 seconds.</p></div>
  </form>;
}
