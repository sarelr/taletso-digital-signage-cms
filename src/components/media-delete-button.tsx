"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function MediaDeleteButton({ mediaId, title }: { mediaId: string; title: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    if (!window.confirm(`Remove “${title}” from the Media Library? This cannot be undone.`)) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/media/${encodeURIComponent(mediaId)}`, { method: "DELETE" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Media deletion failed.");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Media deletion failed.");
    } finally {
      setBusy(false);
    }
  }

  return <div className="min-w-40">
    <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-700 hover:bg-red-50 disabled:opacity-50">
      <Trash2 size={14}/>{busy ? "Removing…" : "Delete"}
    </button>
    {message && <p role="alert" className="mt-2 max-w-64 text-xs text-red-700">{message}</p>}
  </div>;
}
