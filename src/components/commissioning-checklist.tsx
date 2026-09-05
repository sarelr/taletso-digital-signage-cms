"use client";

import { useActionState, useState } from "react";
import { Check, CircleAlert, ClipboardCheck, MonitorUp, Save } from "lucide-react";
import { saveCommissioning, type CommissioningActionState } from "@/app/(portal)/commissioning/actions";
import { commissioningSteps, pilotDevice, type CommissioningStepId } from "@/lib/commissioning";

type CommissioningRecord = {
  screenId: string; screenName: string; location: string; status: string;
  manufacturer: string; modelNumber: string; serialNumber: string; assetTag: string;
  macAddress: string; playerType: string; playerIdentifier: string; resolution: string;
  orientation: "LANDSCAPE" | "PORTRAIT"; evidenceReference: string; blockerNotes: string;
} & Record<CommissioningStepId, boolean>;

const idleState: CommissioningActionState = { status: "idle", message: "" };

export function CommissioningChecklist({ initial }: { initial: CommissioningRecord }) {
  const [completed, setCompleted] = useState<Record<CommissioningStepId, boolean>>(() =>
    Object.fromEntries(commissioningSteps.map((step) => [step.id, initial[step.id]])) as Record<CommissioningStepId, boolean>,
  );
  const [state, formAction, pending] = useActionState(saveCommissioning, idleState);
  const completedCount = commissioningSteps.filter((step) => completed[step.id]).length;
  const progress = Math.round((completedCount / commissioningSteps.length) * 100);
  const toggleStep = (id: CommissioningStepId) => setCompleted((current) => ({ ...current, [id]: !current[id] }));

  return (
    <form action={formAction} className="p-5 lg:p-8">
      <input type="hidden" name="screenId" value={initial.screenId} />
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-widest text-[#b07822]">First-device pilot</p><h1 className="mt-2 text-3xl font-bold text-[#07172c]">TV Commissioning</h1><p className="mt-2 max-w-2xl text-slate-500">Prepare, test and approve the first Taletso display before campus rollout.</p></div><button type="submit" disabled={pending} className="flex items-center gap-2 rounded-xl bg-[#07172c] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save size={17} />{pending ? "Saving..." : "Save commissioning"}</button></div>

      {state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`mb-5 rounded-xl p-3 text-sm ${state.status === "error" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-800"}`}>{state.message}</p> : null}

      <section className="grid gap-4 lg:grid-cols-4" aria-label="Pilot details"><Summary label="Pilot screen" value={initial.screenName} mono /><Summary label="Collection" value={pilotDevice.collectionDate} /><Summary label="Location" value={initial.location} /><Summary label="Saved status" value={initial.status.replaceAll("_", " ")} note={`Current form: ${progress}%`} mono /></section>

      <section className="card mt-6 p-5" aria-labelledby="device-details-heading"><h2 id="device-details-heading" className="font-bold text-[#07172c]">Device and evidence record</h2><div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><Field name="manufacturer" label="Manufacturer" value={initial.manufacturer} required /><Field name="modelNumber" label="Model number" value={initial.modelNumber} required /><Field name="serialNumber" label="Serial number" value={initial.serialNumber} required /><Field name="assetTag" label="Asset tag" value={initial.assetTag} required /><Field name="macAddress" label="Player MAC address" value={initial.macAddress} /><Field name="playerType" label="Player type" value={initial.playerType} /><Field name="playerIdentifier" label="Player identifier" value={initial.playerIdentifier} /><Field name="resolution" label="Resolution" value={initial.resolution} /><label className="text-sm font-semibold text-slate-700">Orientation<select name="orientation" defaultValue={initial.orientation} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal"><option value="LANDSCAPE">Landscape</option><option value="PORTRAIT">Portrait</option></select></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-3">Evidence reference<textarea name="evidenceReference" defaultValue={initial.evidenceReference} rows={2} placeholder="Secure folder, ticket or signed record reference" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal" /></label><label className="text-sm font-semibold text-slate-700 sm:col-span-2 xl:col-span-4">Blocker notes<textarea name="blockerNotes" defaultValue={initial.blockerNotes} rows={2} placeholder="Any entry here forces BLOCKED status" className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal" /></label></div></section>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card overflow-hidden"><div className="border-b border-slate-100 p-5"><div className="flex items-center justify-between gap-4"><div><h2 className="font-bold text-[#07172c]">Commissioning gate</h2><p className="mt-1 text-sm text-slate-500">All eight controls must pass and be saved before the TV is ready.</p></div><span className="mono text-sm font-bold">{completedCount}/8</span></div><div className="mt-4 h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#e4ac45] transition-all" style={{ width: `${progress}%` }} /></div></div><ol className="divide-y divide-slate-100">{commissioningSteps.map((step, index) => { const isComplete = completed[step.id]; return <li key={step.id} className="flex gap-4 p-5"><input type="checkbox" name={step.id} checked={isComplete} onChange={() => toggleStep(step.id)} className="sr-only" /><button type="button" onClick={() => toggleStep(step.id)} aria-label={`${isComplete ? "Reopen" : "Complete"} ${step.title}`} aria-pressed={isComplete} className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${isComplete ? "border-emerald-600 bg-emerald-600 text-white" : "border-slate-200 bg-white text-slate-400"}`}>{isComplete ? <Check size={19} /> : <span className="mono text-sm">{index + 1}</span>}</button><div><h3 className="font-semibold text-[#07172c]">{step.title}</h3><p className="mt-1 text-sm text-slate-500">{step.description}</p><p className="mt-2 text-xs font-medium text-slate-400">Evidence: {step.evidence}</p></div></li>; })}</ol></section>
        <aside className="space-y-4"><section className="card p-5"><div className="flex items-center gap-3"><MonitorUp className="text-[#b07822]" size={22} /><h2 className="font-bold text-[#07172c]">Go-live decision</h2></div>{progress === 100 ? <div className="mt-4 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800"><p className="font-bold">Controls complete</p><p className="mt-1">Save the record to mark this TDCP player ready and retain its commissioning evidence.</p></div> : <div className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-800"><p className="flex items-center gap-2 font-bold"><CircleAlert size={17} />Not ready</p><p className="mt-1">{commissioningSteps.length - completedCount} controls remain open.</p></div>}</section><section className="card p-5"><div className="flex items-center gap-3"><ClipboardCheck className="text-[#b07822]" size={22} /><h2 className="font-bold text-[#07172c]">Commissioning kit</h2></div><ul className="mt-4 list-disc space-y-3 pl-5 text-sm text-slate-600"><li>TV, remote and power cable</li><li>Wired network cable</li><li>Keyboard/mouse for initial configuration</li><li>Asset labels and phone camera</li><li>Approved player URL and screen identity</li><li>Temporary hotspot for fallback testing</li></ul></section></aside>
      </div>
    </form>
  );
}

function Field({ name, label, value, required = false }: { name: string; label: string; value: string; required?: boolean }) { return <label className="text-sm font-semibold text-slate-700">{label}<input name={name} defaultValue={value} required={required} maxLength={255} className="mt-1.5 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 font-normal" /></label>; }
function Summary({ label, value, note, mono = false }: { label: string; value: string; note?: string; mono?: boolean }) { return <article className="card p-5"><p className="text-sm text-slate-500">{label}</p><p className={`${mono ? "mono " : ""}mt-2 font-bold text-[#07172c]`}>{value}</p>{note ? <p className="mt-1 text-xs text-slate-400">{note}</p> : null}</article>; }
