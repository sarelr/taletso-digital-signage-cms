import { notFound } from "next/navigation";
import { AlertTriangle, Clock3, Monitor, Radio, Server } from "lucide-react";
import { ScreenPublisher } from "@/components/screen-publisher";
import { ScreenSettingsForm } from "@/components/screen-settings-form";
import { getDb } from "@/lib/db";
import { heartbeatSnapshot, isHeartbeatOnline } from "@/lib/heartbeat";
import { isManagedScreenId } from "@/lib/screen-estate";

export const dynamic = "force-dynamic";

export default async function ScreenPage({ params }: { params: Promise<{ screenId: string }> }) {
  const { screenId } = await params;
  if (!isManagedScreenId(screenId)) notFound();
  const db = getDb();
  const [screen, media] = await Promise.all([
    db.screen.findUnique({ where: { externalId: screenId }, include: { location: true, currentContent: true } }),
    db.content.findMany({ where: { status: "APPROVED", type: { in: ["IMAGE", "VIDEO"] }, url: { startsWith: "media/" }, mimeType: { not: null } }, orderBy: { title: "asc" } }),
  ]);
  if (!screen) notFound();
  const locations = await db.location.findMany({ where: { organisationId: screen.location.organisationId }, orderBy: { name: "asc" }, select: { id: true, name: true } });
  const online = isHeartbeatOnline(screen.lastHeartbeatAt,heartbeatSnapshot());
  return <div className="p-5 lg:p-8">
    <div className="mb-7"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#b07822]">Screen management</p><h1 className="mt-1 text-3xl font-bold text-[#07172c]">Publish to {screenId}</h1><p className="mt-2 text-slate-500">Direct publishing to the backward-compatible browser player.</p></div>
    <div className="mb-6 flex gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"><Radio className="shrink-0" size={20}/><p>The CMS generates a screen-specific JSON configuration. Xibo remains optional.</p></div>
    <ScreenSettingsForm screenId={screenId} name={screen.name} locationId={screen.locationId} locations={locations}/>
    <div className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
      <section className="card overflow-hidden"><div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5"><div><h2 className="text-lg font-bold text-[#07172c]">{screen.name}</h2><p className="mt-1 text-sm text-slate-500">{screenId} · {screen.location.name}</p></div><span className={`rounded-full px-3 py-1.5 text-xs font-bold ${online ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>{online ? "ONLINE" : "OFFLINE"}</span></div>
        <div className="bg-slate-50 p-6"><div className="flex aspect-video flex-col items-center justify-center rounded-xl border-[7px] border-[#07172c] bg-[radial-gradient(circle_at_50%_20%,#17679a,#0b2b47_45%,#050d17)] px-6 text-center text-white shadow-xl"><span className="text-xs font-bold tracking-[0.2em] text-blue-200">TDCP</span><strong className="mt-5 text-2xl">{screen.currentContent?.originalFilename ?? "No media assigned"}</strong><small className="mt-2 tracking-[0.2em] text-blue-200">{screenId}</small></div></div>
        <dl className="grid gap-4 p-5 sm:grid-cols-3"><div><dt className="flex items-center gap-2 text-xs text-slate-400"><Monitor size={15}/>Current media</dt><dd className="mt-2 text-sm font-bold text-[#07172c]">{screen.currentContent?.originalFilename ?? "Not assigned"}</dd></div><div><dt className="flex items-center gap-2 text-xs text-slate-400"><Server size={15}/>Player</dt><dd className="mt-2 text-sm font-bold text-[#07172c]">{screen.playerVersion ?? "WEB_PLAYER"}</dd></div><div><dt className="flex items-center gap-2 text-xs text-slate-400"><Clock3 size={15}/>Last seen</dt><dd className="mt-2 text-sm font-bold text-[#07172c]">{screen.lastHeartbeatAt ? screen.lastHeartbeatAt.toLocaleString("en-ZA") : "Never"}</dd></div></dl>
        {!online && <div className="mx-5 mb-5 flex gap-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800"><AlertTriangle size={17} className="shrink-0"/>No heartbeat was received during the last 90 seconds. Publishing remains available but delivery is not yet confirmed.</div>}
      </section>
      <ScreenPublisher screenId={screenId} currentContentId={screen.currentContentId} media={media.map((item) => ({ id:item.id,title:item.title,filename:item.originalFilename!,mimeType:item.mimeType!,fileSize:item.fileSize }))}/>
    </div>
  </div>;
}
