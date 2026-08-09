import { Clock3, MonitorCheck, WifiOff } from "lucide-react";
import { db } from "@/lib/db";

const readinessScore = (values: string[]) => {
  const weights: Record<string, number> = { NOT_STARTED: 0, BLOCKED: 25, IN_PROGRESS: 60, READY: 100 };
  return Math.round(values.reduce((sum, value) => sum + (weights[value] ?? 0), 0) / Math.max(values.length, 1));
};

export default async function DashboardPage() {
  const [locations, contentCount, pendingApprovals, activeSchedules, recentAudits] = await Promise.all([
    db.location.findMany({
      include: { screens: true, readiness: true },
      orderBy: { name: "asc" },
    }),
    db.content.count(),
    db.approval.count({ where: { decision: "PENDING" } }),
    db.schedule.count({ where: { status: "ACTIVE" } }),
    db.audit.findMany({ orderBy: { createdAt: "desc" }, take: 4 }),
  ]);

  const screens = locations.flatMap((location) => location.screens);
  const onlineScreens = screens.filter((screen) => screen.status === "ONLINE").length;
  const offlineScreens = screens.filter((screen) => screen.status === "OFFLINE").length;
  const dashboardStats = [
    ["Total displays", String(screens.length), "Registered estate"],
    ["Online", String(onlineScreens), "Currently connected"],
    ["Offline", String(offlineScreens), "Requires attention"],
    ["Content items", String(contentCount), "Library records"],
    ["Pending approvals", String(pendingApprovals), `${activeSchedules} active schedules`],
  ];

  return <div className="p-5 lg:p-8"><div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Operations overview</h1><p className="mt-2 text-slate-500">Live estate health and publishing activity across Taletso TVET College.</p></div>
    <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">{dashboardStats.map(([label,value,note]) => <article key={label} className="card p-5"><p className="text-sm font-medium text-slate-500">{label}</p><p className="mono mt-3 text-3xl font-bold text-[#07172c]">{value}</p><p className="mt-2 text-xs text-slate-400">{note}</p></article>)}</section>
    <div className="mt-7 grid gap-6 xl:grid-cols-[1.7fr_1fr]"><section><h2 className="mb-3 text-lg font-bold text-[#07172c]">Campus estate</h2><div className="grid gap-4 sm:grid-cols-2">{locations.map((campus) => {
      const online = campus.screens.filter((screen) => screen.status === "ONLINE").length;
      const offline = campus.screens.filter((screen) => screen.status === "OFFLINE").length;
      const readiness = campus.readiness ? readinessScore([campus.readiness.power, campus.readiness.network, campus.readiness.mounting, campus.readiness.player]) : 0;
      return <article key={campus.code} className="card p-5"><p className="font-bold text-[#07172c]">{campus.name}</p><p className="mono text-xs text-slate-400">{campus.code} · {campus.screens.length} displays</p><div className="mt-5 flex gap-5 text-sm"><span className="flex items-center gap-2 text-emerald-700"><MonitorCheck size={17}/>{online} online</span>{offline > 0 && <span className="flex items-center gap-2 text-rose-600"><WifiOff size={17}/>{offline} offline</span>}</div><div className="mt-5"><div className="mb-1 flex justify-between text-xs"><span>Site readiness</span><span>{readiness}%</span></div><div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-[#e4ac45]" style={{width:`${readiness}%`}}/></div></div></article>;
    })}</div></section>
    <section><h2 className="mb-3 text-lg font-bold text-[#07172c]">Recent activity</h2><div className="card divide-y divide-slate-100">{recentAudits.length > 0 ? recentAudits.map((event)=><div key={event.id} className="flex gap-3 p-4"><Clock3 size={18} className="mt-1 text-[#b07822]"/><div><p className="text-sm font-medium">{event.action}</p><p className="mt-1 text-xs text-slate-400">{event.entityType} · {event.createdAt.toLocaleString("en-ZA")}</p></div></div>) : <div className="p-6 text-sm text-slate-500">No audit activity recorded yet.</div>}</div></section></div>
  </div>;
}
