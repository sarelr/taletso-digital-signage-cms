import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { updateReadiness } from "./actions";

const options = ["NOT_STARTED", "IN_PROGRESS", "READY", "BLOCKED"] as const;

export default async function ReadinessPage() {
  const session = await auth();
  const db = getDb();
  const actor = session?.user?.id ? await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  }) : null;
  const canManage = actor?.role.permissions.some((item) => item.permission.key === "readiness.manage") ?? false;
  const locations = await db.location.findMany({ include: { readiness: true }, orderBy: { name: "asc" } });

  return <div className="p-5 lg:p-8">
    <div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Site readiness</h1><p className="mt-2 text-slate-500">Track power, network, mounting and player readiness at every Taletso location.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">{locations.map((location) => {
      const readiness = location.readiness;
      return <form key={location.id} action={updateReadiness} className="card p-5">
        <input type="hidden" name="locationId" value={location.id}/>
        <div className="mb-4"><h2 className="text-lg font-bold text-[#07172c]">{location.name}</h2><p className="mono text-xs text-slate-400">{location.code}</p></div>
        <div className="grid gap-3 sm:grid-cols-2">{(["power","network","mounting","player"] as const).map((field) => <label key={field} className="text-sm"><span className="mb-1 block capitalize text-slate-500">{field}</span><select name={field} defaultValue={readiness?.[field] ?? "NOT_STARTED"} disabled={!canManage} className="w-full rounded-lg border px-3 py-2">{options.map((value) => <option key={value} value={value}>{value.replaceAll("_", " ")}</option>)}</select></label>)}</div>
        <label className="mt-3 block text-sm"><span className="mb-1 block text-slate-500">Target date</span><input type="date" name="targetDate" disabled={!canManage} defaultValue={readiness?.targetDate ? readiness.targetDate.toISOString().slice(0,10) : ""} className="w-full rounded-lg border px-3 py-2"/></label>
        <label className="mt-3 block text-sm"><span className="mb-1 block text-slate-500">Notes</span><textarea name="notes" disabled={!canManage} defaultValue={readiness?.notes ?? ""} className="min-h-24 w-full rounded-lg border px-3 py-2"/></label>
        {canManage && <button className="mt-4 rounded-lg bg-[#07172c] px-4 py-2 font-semibold text-white">Save readiness</button>}
      </form>;
    })}</div>
  </div>;
}
