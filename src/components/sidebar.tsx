import Link from "next/link";
import { Activity, CalendarDays, ClipboardCheck, FileStack, LayoutDashboard, ListVideo, Monitor, MonitorCog, Settings, ShieldCheck, Users } from "lucide-react";
export const portalLinks = [
  ["/", "Dashboard", LayoutDashboard], ["/screens", "Screens", Monitor], ["/commissioning", "TV Commissioning", MonitorCog], ["/content", "Content Library", FileStack],
  ["/playlists", "Playlists", ListVideo], ["/scheduling", "Scheduling", CalendarDays], ["/approvals", "Approvals", ShieldCheck],
  ["/users", "Users", Users], ["/audit", "Audit Logs", Activity], ["/readiness", "Site Readiness", ClipboardCheck], ["/settings", "Settings", Settings],
] as const;
export function Sidebar() {
  return <aside className="desktop-nav fixed inset-y-0 left-0 z-20 w-64 border-r-4 border-[#f2b705] bg-[#111111] px-4 py-6 text-white">
    <div className="mb-8 flex items-center gap-3 px-2"><img src="/taletso-logo.jpg" alt="Taletso TVET College" className="h-12 w-12 rounded-full border-2 border-[#f2b705] bg-white object-cover"/><div><p className="font-bold">Taletso TVET College</p><p className="text-xs text-slate-300">Digital Signage CMS</p></div></div>
    <nav aria-label="Primary navigation" className="space-y-1">{portalLinks.map(([href,label,Icon]) => <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"><Icon size={18}/>{label}</Link>)}</nav>
  </aside>;
}
