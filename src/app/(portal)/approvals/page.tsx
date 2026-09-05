import { decideApproval } from "../operations-actions";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ApprovalsPage() {
  const items = await getDb().content.findMany({ where: { status: "PENDING_APPROVAL" }, include: { owner: true }, orderBy: { updatedAt: "asc" } });
  return <div className="p-5 lg:p-8"><h1 className="text-3xl font-bold text-[#07172c]">Content Approvals</h1><p className="mt-2 text-slate-500">Review submitted communications. Contributors cannot approve their own content.</p><div className="mt-7 space-y-4">{items.map(item => <section className="card p-5" key={item.id}><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="text-lg font-bold">{item.title}</h2><p className="text-sm text-slate-500">Submitted by {item.owner.name ?? item.owner.email} · {item.mimeType ?? item.type}</p></div><form action={decideApproval} className="flex flex-wrap gap-2"><input type="hidden" name="contentId" value={item.id}/><input name="comment" aria-label="Decision comment" placeholder="Decision comment" className="rounded-lg border px-3 py-2 text-sm"/><button name="decision" value="REJECTED" className="rounded-lg border border-red-200 px-4 py-2 text-sm font-semibold text-red-700">Reject</button><button name="decision" value="APPROVED" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white">Approve</button></form></div></section>)}{items.length === 0 && <div className="card p-8 text-center text-slate-500">No communications are awaiting approval.</div>}</div></div>;
}
