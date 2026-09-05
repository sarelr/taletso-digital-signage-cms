"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Upload } from "lucide-react";

export function MediaUploader() {
  const router = useRouter(); const [message,setMessage]=useState(""); const [busy,setBusy]=useState(false);
  async function submit(formData: FormData) { setBusy(true); setMessage(""); try { const response=await fetch("/api/media/upload",{method:"POST",body:formData}); const body=await response.json(); if(!response.ok) throw new Error(body.error ?? "Upload failed."); setMessage("Media uploaded and approved for assignment."); router.refresh(); } catch(error){setMessage(error instanceof Error ? error.message : "Upload failed.");} finally{setBusy(false);} }
  return <form action={submit} className="card mb-6 grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end"><label className="text-sm font-semibold text-[#07172c]">Media title<input name="title" required maxLength={160} className="mt-2 block w-full rounded-lg border px-3 py-2 font-normal"/></label><label className="text-sm font-semibold text-[#07172c]">File<input name="file" type="file" required accept="image/jpeg,image/png,image/webp,image/svg+xml,video/mp4" className="mt-2 block w-full text-sm font-normal"/></label><button disabled={busy} className="flex items-center justify-center gap-2 rounded-xl bg-[#07172c] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Upload size={17}/>{busy?"Uploading…":"Upload"}</button>{message&&<p role="status" className="text-sm md:col-span-3">{message}</p>}<p className="text-xs text-slate-500 md:col-span-3">JPG, PNG, WEBP, safe SVG or MP4 · maximum 100 MB · format verified from file contents.</p></form>;
}
