import { ContentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { addPlaylistItem, createPlaylist } from "./actions";

export default async function PlaylistsPage() {
  const user = await requireCurrentUser();
  const scoped = CAMPUS_SCOPED_ROLES.has(user.role.name);
  const locationFilter = scoped ? { locationId: user.locationId ?? "__unassigned__" } : {};

  const [playlists, approvedContent, locations] = await Promise.all([
    db.playlist.findMany({
      where: locationFilter,
      include: { location: true, items: { include: { content: true }, orderBy: { position: "asc" } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.content.findMany({
      where: { status: ContentStatus.APPROVED, ...(scoped ? { locationId: user.locationId ?? "__unassigned__" } : {}) },
      orderBy: { title: "asc" },
    }),
    db.location.findMany({ orderBy: { name: "asc" } }),
  ]);

  return <div className="p-5 lg:p-8">
    <div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Playlists</h1><p className="mt-2 text-slate-500">Build ordered playback lists from approved content.</p></div>

    {user.permissionKeys.includes("playlists.manage") && <form action={createPlaylist} className="card mb-6 grid gap-3 p-5 md:grid-cols-3">
      <input name="name" required minLength={3} placeholder="Playlist name" className="rounded-lg border px-3 py-2"/>
      <input name="description" placeholder="Description" className="rounded-lg border px-3 py-2"/>
      {!scoped && <select name="locationId" className="rounded-lg border px-3 py-2" defaultValue=""><option value="">College-wide</option>{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select>}
      <button className="rounded-lg bg-[#07172c] px-4 py-2 font-semibold text-white md:col-span-3 md:w-fit">Create playlist</button>
    </form>}

    <div className="space-y-5">{playlists.map((playlist) => <article key={playlist.id} className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-bold text-[#07172c]">{playlist.name}</h2><p className="mt-1 text-sm text-slate-500">{playlist.location?.name ?? "College-wide"} · {playlist.items.length} item{playlist.items.length === 1 ? "" : "s"}</p>{playlist.description && <p className="mt-2 text-sm text-slate-600">{playlist.description}</p>}</div></div>

      <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-3 py-2">#</th><th className="px-3 py-2">Content</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">Duration</th></tr></thead><tbody>{playlist.items.map((item) => <tr key={item.contentId} className="border-t"><td className="px-3 py-2">{item.position}</td><td className="px-3 py-2 font-medium">{item.content.title}</td><td className="px-3 py-2 text-slate-500">{item.content.type}</td><td className="px-3 py-2 text-slate-500">{item.durationSeconds}s</td></tr>)}{playlist.items.length === 0 && <tr><td colSpan={4} className="px-3 py-5 text-center text-slate-400">No content added yet.</td></tr>}</tbody></table></div>

      {user.permissionKeys.includes("playlists.manage") && <form action={addPlaylistItem} className="mt-4 flex flex-wrap gap-2"><input type="hidden" name="playlistId" value={playlist.id}/><select name="contentId" required className="min-w-64 rounded-lg border px-3 py-2"><option value="">Select approved content</option>{approvedContent.filter((item) => !playlist.locationId || !item.locationId || item.locationId === playlist.locationId).map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select><input name="durationSeconds" type="number" min={5} max={3600} defaultValue={10} className="w-28 rounded-lg border px-3 py-2"/><button className="rounded-lg border px-4 py-2 font-semibold text-[#07172c]">Add item</button></form>}
    </article>)}{playlists.length === 0 && <div className="card p-10 text-center text-slate-400">No playlists have been created yet.</div>}</div>
  </div>;
}
