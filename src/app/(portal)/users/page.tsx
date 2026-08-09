import { auth } from "@/auth";
import { getDb } from "@/lib/db";
import { createUser } from "./actions";

export default async function UsersPage() {
  const session = await auth();
  const db = getDb();
  const actor = session?.user?.id ? await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  }) : null;
  const canManage = actor?.role.permissions.some((item) => item.permission.key === "users.manage") ?? false;
  const [users, roles, locations] = await Promise.all([
    db.user.findMany({ include: { role: true, location: true }, orderBy: { createdAt: "desc" } }),
    db.role.findMany({ orderBy: { name: "asc" } }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <div className="p-5 lg:p-8">
    <div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Users & access</h1><p className="mt-2 text-slate-500">Provision users and assign Taletso roles and campus scope.</p></div>
    {canManage && <form action={createUser} className="card mb-7 grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-5">
      <input name="name" required minLength={2} placeholder="Full name" className="rounded-lg border px-3 py-2" />
      <input name="email" type="email" required placeholder="Email" className="rounded-lg border px-3 py-2" />
      <input name="password" type="password" required minLength={12} placeholder="Temporary password" className="rounded-lg border px-3 py-2" />
      <select name="roleId" required className="rounded-lg border px-3 py-2"><option value="">Select role</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select>
      <select name="locationId" className="rounded-lg border px-3 py-2"><option value="">Global / no campus</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>
      <button className="rounded-lg bg-[#07172c] px-4 py-2 font-semibold text-white md:col-span-2 xl:col-span-5">Create user</button>
    </form>}
    <div className="card overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">User</th><th className="px-5 py-4">Email</th><th className="px-5 py-4">Role</th><th className="px-5 py-4">Campus scope</th><th className="px-5 py-4">Created</th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-t border-slate-100"><td className="px-5 py-4 font-semibold">{user.name ?? "Unnamed"}</td><td className="px-5 py-4">{user.email}</td><td className="px-5 py-4">{user.role.name}</td><td className="px-5 py-4">{user.location?.name ?? "Global"}</td><td className="px-5 py-4">{user.createdAt.toLocaleDateString("en-ZA")}</td></tr>)}</tbody></table></div>
  </div>;
}
