import Link from "next/link";
import { Activity, CalendarDays, ClipboardCheck, FileStack, LayoutDashboard, ListVideo, Monitor, Settings, ShieldCheck, Users } from "lucide-react";
const links = [
  ["/", "Dashboard", LayoutDashboard], ["/screens", "Screens", Monitor], ["/content", "Content Library", FileStack],
  ["/playlists", "Playlists", ListVideo], ["/scheduling", "Scheduling", CalendarDays], ["/approvals", "Approvals", ShieldCheck],
  ["/users", "Users", Users], ["/audit", "Audit Logs", Activity], ["/readiness", "Site Readiness", ClipboardCheck], ["/settings", "Settings", Settings],
] as const;
export function Sidebar() {
  return <aside className="desktop-nav fixed inset-y-0 left-0 z-20 w-64 bg-[#07172c] px-4 py-6 text-white">
    <div className="mb-8 flex items-center gap-3 px-2"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#e4ac45] font-black text-[#07172c]">T</div><div><p className="font-bold">Taletso TVET</p><p className="text-xs text-slate-400">Digital Signage CMS</p></div></div>
    <nav aria-label="Primary navigation" className="space-y-1">{links.map(([href,label,Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><Icon size={18}/>{label}</Link>)}</nav>
  </aside>;
}
