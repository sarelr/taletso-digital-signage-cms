"use client";

import { useActionState } from "react";
import { syncBase44Content, type Base44SyncState } from "@/app/(portal)/settings/actions";

const initialState: Base44SyncState = { message: "", ok: false };

export function Base44SyncForm() {
  const [state, action, pending] = useActionState(syncBase44Content, initialState);
  return <form action={action} className="card mt-6 p-5">
    <h2 className="text-lg font-bold">Base44 content connection</h2>
    <p className="mt-2 text-sm text-slate-600">Pull public Taletso announcements, gallery images, live streams and feed posts into TDCP as drafts. Existing source items are updated instead of duplicated.</p>
    <button disabled={pending} className="mt-4 rounded-lg bg-[#07172c] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{pending ? "Syncing…" : "Sync Base44 content"}</button>
    {state.message ? <p className={`mt-3 text-sm ${state.ok ? "text-emerald-700" : "text-red-700"}`}>{state.message}</p> : null}
  </form>;
}
