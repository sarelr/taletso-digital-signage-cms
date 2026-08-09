import { ContentStatus, ContentType } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { createContent, submitContent } from "./actions";

export default async function ContentPage() {
  const user = await requireCurrentUser();
  const scoped = CAMPUS_SCOPED_ROLES.has(user.role.name);
  const where = scoped ? { locationId: user.locationId ?? "__unassigned__" } : {};

  const [content, locations] = await Promise.all([
    db.content.findMany({
      where,
      include: { owner: true, location: true, approvals: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
    }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <div className="p-5 lg:p-8">
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="text-3xl font-bold text-[#07172c]">Content Library</h1><p className="mt-2 text-slate-500">Create, review and govern signage content before publication.</p></div>
    </div>

    {user.permissionKeys.includes("content.create") && <form action={createContent} className="card mb-6 grid gap-3 p-5 md:grid-cols-4">
      <input name="title" required minLength={3} placeholder="Content title" className="rounded-lg border px-3 py-2" />
      <select name="type" className="rounded-lg border px-3 py-2" defaultValue={ContentType.IMAGE}>
        {Object.values(ContentType).map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <input name="url" type="url" placeholder="Media or webpage URL" className="rounded-lg border px-3 py-2" />
      {!scoped && <select name="locationId" className="rounded-lg border px-3 py-2" defaultValue=""><option value="">College-wide</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>}
      <button className="rounded-lg bg-[#07172c] px-4 py-2 font-semibold text-white md:col-span-4 md:w-fit">Create draft</button>
    </form>}

    <div className="card overflow-hidden">
      <div className="overflow-x-auto"><table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Title</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Campus</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Action</th></tr></thead>
        <tbody>{content.map((item) => <tr key={item.id} className="border-t border-slate-100">
          <td className="px-5 py-4 font-semibold text-[#07172c]">{item.url ? <a href={item.url} target="_blank" rel="noreferrer" className="hover:underline">{item.title}</a> : item.title}</td>
          <td className="px-5 py-4 text-slate-600">{item.type}</td>
          <td className="px-5 py-4 text-slate-600">{item.location?.name ?? "College-wide"}</td>
          <td className="px-5 py-4 text-slate-600">{item.owner.name ?? item.owner.email}</td>
          <td className="px-5 py-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold">{item.status.replaceAll("_", " ")}</span></td>
          <td className="px-5 py-4">{item.status === ContentStatus.DRAFT && (item.ownerId === user.id || user.permissionKeys.includes("content.approve")) ? <form action={submitContent}><input type="hidden" name="contentId" value={item.id}/><button className="rounded-lg border px-3 py-1.5 font-semibold text-[#07172c]">Submit for approval</button></form> : <span className="text-xs text-slate-400">—</span>}</td>
        </tr>)}{content.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-400">No content records yet.</td></tr>}</tbody>
      </table></div>
    </div>
  </div>;
}
