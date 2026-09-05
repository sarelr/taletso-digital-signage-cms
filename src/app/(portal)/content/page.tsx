import { MediaUploader } from "@/components/media-uploader";
import { MediaDeleteButton } from "@/components/media-delete-button";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ContentPage() {
  const content = await getDb().content.findMany({ include:{owner:true}, orderBy:{createdAt:"desc"} });
  return <div className="p-5 lg:p-8"><div className="mb-7"><h1 className="text-3xl font-bold text-[#07172c]">Content Library</h1><p className="mt-2 text-slate-500">Upload validated media and make it available for screen assignment.</p></div><MediaUploader/><div className="card overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Asset</th><th className="px-5 py-4">Type</th><th className="px-5 py-4">Size</th><th className="px-5 py-4">Status</th><th className="px-5 py-4">Owner</th><th className="px-5 py-4">Actions</th></tr></thead><tbody>{content.map(item=><tr key={item.id} className="border-t border-slate-100 align-top"><td className="px-5 py-4"><strong className="block text-[#07172c]">{item.title}</strong><small className="text-slate-400">{item.originalFilename ?? item.url ?? "No file"}</small></td><td className="px-5 py-4 text-slate-600">{item.mimeType ?? item.type}</td><td className="px-5 py-4 text-slate-600">{item.fileSize ? `${(item.fileSize/1024/1024).toFixed(2)} MB` : "—"}</td><td className="px-5 py-4">{item.status}</td><td className="px-5 py-4 text-slate-600">{item.owner.name ?? item.owner.email}</td><td className="px-5 py-4"><MediaDeleteButton mediaId={item.id} title={item.title}/></td></tr>)}</tbody></table>{content.length===0&&<p className="p-6 text-sm text-slate-500">No media has been registered.</p>}</div></div></div>;
}
