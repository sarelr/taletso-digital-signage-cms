import { getDb } from "@/lib/db";

export default async function AuditPage() {
  const db = getDb();
  const audits = await db.audit.findMany({ include: { actor: true }, orderBy: { createdAt: "desc" }, take: 100 });
  return <div className="p-5 lg:p-8">
    <div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Audit logs</h1><p className="mt-2 text-slate-500">Recent administrative and publishing activity.</p></div>
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Time</th><th className="px-5 py-4">Action</th><th className="px-5 py-4">Entity</th><th className="px-5 py-4">Actor</th><th className="px-5 py-4">Metadata</th></tr></thead><tbody>{audits.map((item) => <tr key={item.id} className="border-t border-slate-100"><td className="px-5 py-4">{item.createdAt.toLocaleString("en-ZA")}</td><td className="px-5 py-4 font-semibold">{item.action}</td><td className="px-5 py-4">{item.entityType}</td><td className="px-5 py-4">{item.actor?.name ?? item.actor?.email ?? "System"}</td><td className="px-5 py-4 mono text-xs text-slate-500">{item.metadata ? JSON.stringify(item.metadata) : "—"}</td></tr>)}</tbody></table></div>
  </div>;
}
