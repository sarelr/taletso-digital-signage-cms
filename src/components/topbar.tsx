"use client";

import Link from "next/link";
import { useState } from "react";
import { Bell, Menu, Search, X } from "lucide-react";
import { portalLinks } from "@/components/sidebar";

export function Topbar() {
  const [navigationOpen, setNavigationOpen] = useState(false);
  const today = new Intl.DateTimeFormat("en-ZA", { dateStyle: "full", timeZone: "Africa/Johannesburg" }).format(new Date());
  return <>
    <header className="sticky top-0 z-30 flex min-h-20 items-center justify-between border-b-2 border-[#f2b705] bg-white/95 px-4 py-3 shadow-sm backdrop-blur lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" onClick={()=>setNavigationOpen(true)} className="shrink-0 rounded-xl border border-[#d7a200] bg-[#111111] p-2.5 text-white shadow-sm lg:hidden" aria-label="Open navigation menu" aria-expanded={navigationOpen}><Menu size={21}/></button>
        <img src="/taletso-logo.jpg" alt="Taletso TVET College logo" className="h-11 w-11 shrink-0 rounded-full border-2 border-[#f2b705] bg-white object-cover shadow-sm"/>
        <div className="min-w-0"><p className="truncate text-[11px] font-bold uppercase tracking-[0.16em] text-[#8a5a00] sm:text-xs">Taletso communications operations</p><p className="truncate text-xs text-slate-500 sm:text-sm">{today}</p></div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3"><label className="hidden items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 md:flex"><Search size={17} className="text-slate-400"/><input aria-label="Search" className="w-44 outline-none" placeholder="Search workspace"/></label><button className="hidden rounded-xl border border-slate-200 p-2.5 sm:block" aria-label="Notifications"><Bell size={19}/></button><div className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 border-[#f2b705] bg-[#111111] text-sm font-bold text-white">TA</div></div>
    </header>
    {navigationOpen&&<div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button type="button" className="absolute inset-0 bg-black/60" onClick={()=>setNavigationOpen(false)} aria-label="Close navigation menu"/>
      <aside className="relative h-full w-[min(86vw,20rem)] overflow-y-auto border-r-4 border-[#f2b705] bg-[#111111] px-4 py-5 text-white shadow-2xl">
        <div className="mb-7 flex items-center justify-between gap-3 px-2"><div className="flex items-center gap-3"><img src="/taletso-logo.jpg" alt="Taletso TVET College" className="h-14 w-14 rounded-full border-2 border-[#f2b705] bg-white object-cover"/><div><p className="font-bold">Taletso TVET College</p><p className="text-xs text-slate-300">Digital Signage CMS</p></div></div><button type="button" onClick={()=>setNavigationOpen(false)} className="rounded-lg border border-white/20 p-2 text-white" aria-label="Close navigation menu"><X size={20}/></button></div>
        <nav aria-label="Mobile primary navigation" className="space-y-1">{portalLinks.map(([href,label,Icon])=><Link key={href} href={href} onClick={()=>setNavigationOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-slate-200 hover:bg-[#f2b705] hover:text-[#111111]"><Icon size={19}/>{label}</Link>)}</nav>
      </aside>
    </div>}
  </>;
}
