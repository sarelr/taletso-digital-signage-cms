import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { createSchedule } from "./actions";

export default async function SchedulingPage() {
  const session = await auth();
  const db = getDb();
  const user = session?.user?.id ? await db.user.findUnique({ where: { id: session.user.id }, include: { role: true } }) : null;
  const locationId = user && CAMPUS_SCOPED_ROLES.has(user.role.name) ? user.locationId : null;

  const [playlists, groups, schedules] = await Promise.all([
    db.playlist.findMany({ where: locationId ? { locationId } : {}, orderBy: { name: "asc" } }),
    db.screenGroup.findMany({
      where: locationId ? { screens: { some: { screen: { locationId } } } } : {},
      include: { screens: { include: { screen: true } } },
      orderBy: { name: "asc" },
    }),
    db.schedule.findMany({
      where: locationId ? { playlist: { locationId } } : {},
      include: { playlist: true, screenGroup: true },
      orderBy: { startsAt: "desc" },
      take: 50,
    }),
  ]);

  return <div className="p-5 lg:p-8">
    <div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Scheduling</h1><p className="mt-2 text-slate-500">Schedule approved playlists to Taletso display groups.</p></div>
    <form action={createSchedule} className="card mb-7 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
      <input name="name" required minLength={3} placeholder="Schedule name" className="rounded-lg border px-3 py-2" />
      <select name="playlistId" required className="rounded-lg border px-3 py-2"><option value="">Select playlist</option>{playlists.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <select name="screenGroupId" required className="rounded-lg border px-3 py-2"><option value="">Select display group</option>{groups.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.screens.length})</option>)}</select>
      <input name="startsAt" required type="datetime-local" className="rounded-lg border px-3 py-2" />
      <input name="endsAt" required type="datetime-local" className="rounded-lg border px-3 py-2" />
      <button className="rounded-lg bg-[#07172c] px-4 py-2 font-semibold text-white md:col-span-2 xl:col-span-5">Create schedule</button>
    </form>

    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Schedule</th><th className="px-5 py-4">Playlist</th><th className="px-5 py-4">Display group</th><th className="px-5 py-4">Start</th><th className="px-5 py-4">End</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Xibo</th></tr></thead><tbody>{schedules.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{item.name}</td><td className="px-5 py-4">{item.playlist.name}</td><td className="px-5 py-4">{item.screenGroup.name}</td><td className="px-5 py-4">{item.startsAt.toLocaleString("en-ZA")}</td><td className="px-5 py-4">{item.endsAt.toLocaleString("en-ZA")}</td><td className="px-5 py-4">{item.status}</td><td className="px-5 py-4 mono text-xs">{item.externalId ?? "Pending sync"}</td></tr>)}</tbody></table></div>
  </div>;
}
