import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

function eventLabel(action: string) {
  return action.split(".").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

function eventTarget(entityType: string, entityId: string, metadata: unknown) {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const values = metadata as Record<string, unknown>;
    const named = values.screenId ?? values.originalFilename ?? values.storageName;
    if (typeof named === "string" && named.trim()) return named;
  }
  return `${entityType} · ${entityId.slice(0, 12)}`;
}

export default async function AuditPage() {
  const audits = await getDb().audit.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return <div className="p-5 lg:p-8">
    <div className="mb-7">
      <h1 className="text-3xl font-bold text-[#07172c]">Audit Logs</h1>
      <p className="mt-2 text-slate-500">Database-backed operational history for security and governance review.</p>
    </div>
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Event</th><th className="px-5 py-4">Actor</th><th className="px-5 py-4">Target</th><th className="px-5 py-4">Time</th></tr></thead>
          <tbody>{audits.map((event) => <tr key={event.id} className="border-t border-slate-100"><td className="px-5 py-4 font-medium text-[#07172c]">{eventLabel(event.action)}</td><td className="px-5 py-4 text-slate-600">{event.actor?.name ?? event.actor?.email ?? "System"}</td><td className="px-5 py-4 text-slate-600">{eventTarget(event.entityType, event.entityId, event.metadata)}</td><td className="px-5 py-4 text-slate-500">{event.createdAt.toLocaleString("en-ZA")}</td></tr>)}</tbody>
        </table>
        {audits.length === 0 && <p className="p-6 text-sm text-slate-500">No audit activity recorded.</p>}
      </div>
    </div>
    <p className="mt-3 text-xs text-slate-400">Showing the 200 most recent immutable audit records.</p>
  </div>;
}
