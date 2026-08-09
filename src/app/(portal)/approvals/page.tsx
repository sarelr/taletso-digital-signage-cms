import { ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { approveContent, rejectContent } from "./actions";

export default async function ApprovalsPage() {
  const user = await requireCurrentUser();
  const canApprove = user.permissionKeys.includes("content.approve");
  const scoped = CAMPUS_SCOPED_ROLES.has(user.role.name);

  const items = await db.content.findMany({
    where: {
      status: ContentStatus.PENDING_APPROVAL,
      ...(scoped ? { locationId: user.locationId ?? "__unassigned__" } : {}),
    },
    include: { owner: true, location: true },
    orderBy: { updatedAt: "asc" },
  });

  return <div className="p-5 lg:p-8">
    <div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Approvals</h1><p className="mt-2 text-slate-500">Four-eye review queue for content awaiting publication approval.</p></div>

    {!canApprove && <div className="card mb-5 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your role can view this queue but does not include the <strong>content.approve</strong> permission.</div>}

    <div className="space-y-4">{items.map((item) => {
      const ownContent = item.ownerId === user.id;
      return <article key={item.id} className="card p-5">
        <div className="flex flex-wrap justify-between gap-4">
          <div><div className="flex items-center gap-2"><h2 className="text-lg font-bold text-[#07172c]">{item.title}</h2><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Pending approval</span></div><p className="mt-2 text-sm text-slate-500">{item.type} · {item.location?.name ?? "College-wide"} · submitted by {item.owner.name ?? item.owner.email}</p>{item.url && <a href={item.url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm font-semibold text-[#b07822] hover:underline">Preview content</a>}</div>
        </div>

        {canApprove && !ownContent ? <form className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
          <input type="hidden" name="contentId" value={item.id}/>
          <input name="comment" maxLength={500} placeholder="Approval or rejection comment (optional)" className="rounded-lg border px-3 py-2"/>
          <button formAction={approveContent} className="rounded-lg bg-[#07172c] px-4 py-2 font-semibold text-white">Approve</button>
          <button formAction={rejectContent} className="rounded-lg border border-rose-200 px-4 py-2 font-semibold text-rose-700">Reject to draft</button>
        </form> : ownContent ? <p className="mt-4 text-sm font-medium text-slate-500">Four-eye control: you cannot approve content that you own.</p> : null}
      </article>;
    })}{items.length === 0 && <div className="card p-10 text-center text-slate-400">There is no content awaiting approval.</div>}</div>
  </div>;
}
