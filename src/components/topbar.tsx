import { Bell, Menu, Search } from "lucide-react";

export function Topbar() {
  const today = new Intl.DateTimeFormat("en-ZA", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" }).format(new Date());
  return <header className="sticky top-0 z-10 flex h-20 items-center justify-between border-b border-slate-200 bg-white/90 px-5 backdrop-blur lg:px-8">
    <div className="flex items-center gap-3"><button className="rounded-lg border p-2 lg:hidden" aria-label="Open navigation"><Menu size={20}/></button><div><p className="text-xs font-bold uppercase tracking-widest text-[#b07822]">Enterprise operations</p><p className="text-sm text-slate-500">{today}</p></div></div>
    <div className="flex items-center gap-3"><label className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 md:flex"><Search size={17} className="text-slate-400"/><input aria-label="Search" className="w-44 outline-none" placeholder="Search workspace"/></label><button className="rounded-xl border border-slate-200 p-2.5" aria-label="Notifications"><Bell size={19}/></button><div className="grid h-10 w-10 place-items-center rounded-full bg-[#07172c] text-sm font-bold text-white">TA</div></div>
  </header>;
}
