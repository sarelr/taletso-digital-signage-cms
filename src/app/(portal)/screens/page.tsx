import Link from "next/link";
import { Monitor, Radio, WifiOff } from "lucide-react";
import { getDb } from "@/lib/db";
import { heartbeatSnapshot, isHeartbeatOnline } from "@/lib/heartbeat";
import { managedScreenIds } from "@/lib/screen-estate";

export const dynamic = "force-dynamic";

export default async function ScreensPage() {
  const screens = await getDb().screen.findMany({ where: { externalId: { in: managedScreenIds } }, include: { location: true, currentContent: true }, orderBy: { externalId: "asc" } });
  const snapshot = heartbeatSnapshot();
  return <div className="p-5 lg:p-8">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a6500]">Central display estate</p><h1 className="mt-1 text-3xl font-bold text-[#111111]">Screens</h1><p className="mt-2 text-slate-500">Independently manage the current twelve-display estate. New screens remain explicitly unassigned until an administrator selects a Taletso site.</p></div>
    <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><Radio className="shrink-0" size={20}/><p>Status is derived from player heartbeats, not configuration. A player is online only when it has contacted TDCP during the last 90 seconds.</p></div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {screens.map((screen) => { const online = isHeartbeatOnline(screen.lastHeartbeatAt,snapshot); return <Link href={`/screens/${screen.externalId}`} key={screen.id} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="flex items-start justify-between"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#07172c] text-blue-200"><Monitor size={21}/></span><span className={`rounded-full px-3 py-1 text-xs font-bold ${online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{online ? "ONLINE" : "OFFLINE"}</span></div>
        <h2 className="mt-4 font-bold text-[#07172c]">{screen.name}</h2><p className="mt-1 text-xs text-slate-500">{screen.externalId ?? "Unregistered"} · {screen.location.name}</p>
        <div className="mt-4 border-t border-slate-100 pt-4 text-xs text-slate-500"><p>Media: <strong className="text-slate-700">{screen.currentContent?.originalFilename ?? "Not assigned"}</strong></p><p className="mt-2">Last contact: {screen.lastHeartbeatAt ? screen.lastHeartbeatAt.toLocaleString("en-ZA") : "Never"}</p></div>
      </Link>; })}
      {screens.length === 0 && <section className="card p-6 text-sm text-slate-500"><WifiOff className="mb-3"/>No screens have been registered. Apply migrations and run the safe seed.</section>}
    </div>
  </div>;
}
