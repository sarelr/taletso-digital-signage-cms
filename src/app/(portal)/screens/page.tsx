import { Monitor, Wifi, WifiOff } from "lucide-react";
import { db } from "@/lib/db";

function statusClass(status: string) {
  if (status === "ONLINE") return "bg-emerald-50 text-emerald-700";
  if (status === "OFFLINE") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

export default async function ScreensPage() {
  const screens = await db.screen.findMany({
    include: { location: true },
    orderBy: [{ location: { name: "asc" } }, { name: "asc" }],
  });

  const online = screens.filter((screen) => screen.status === "ONLINE").length;
  const offline = screens.filter((screen) => screen.status === "OFFLINE").length;

  return (
    <div className="p-5 lg:p-8">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#07172c]">Screens</h1>
          <p className="mt-2 text-slate-500">Live display inventory across all Taletso TVET College locations.</p>
        </div>
        <div className="flex gap-3 text-sm">
          <span className="card flex items-center gap-2 px-4 py-2 text-emerald-700"><Wifi size={16}/>{online} online</span>
          <span className="card flex items-center gap-2 px-4 py-2 text-rose-700"><WifiOff size={16}/>{offline} offline</span>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr><th className="px-5 py-4">Display</th><th className="px-5 py-4">Campus</th><th className="px-5 py-4">External ID</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Last Seen</th></tr>
            </thead>
            <tbody>
              {screens.map((screen) => (
                <tr key={screen.id} className="border-t border-slate-100">
                  <td className="px-5 py-4 font-semibold text-[#07172c]"><span className="flex items-center gap-2"><Monitor size={17}/>{screen.name}</span></td>
                  <td className="px-5 py-4 text-slate-600">{screen.location.name}</td>
                  <td className="mono px-5 py-4 text-xs text-slate-500">{screen.externalId ?? "—"}</td>
                  <td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass(screen.status)}`}>{screen.status}</span></td>
                  <td className="px-5 py-4 text-slate-500">{screen.lastSeenAt ? screen.lastSeenAt.toLocaleString("en-ZA") : "Never"}</td>
                </tr>
              ))}
              {screens.length === 0 && <tr><td colSpan={5} className="px-5 py-10 text-center text-slate-500">No screens found. Run the database seed to create the Taletso display estate.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
