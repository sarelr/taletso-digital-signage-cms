"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { updateScreen, type ScreenUpdateState } from "@/app/(portal)/screens/actions";

type LocationOption = { id: string; name: string };

export function ScreenSettingsForm({ screenId, name, locationId, locations }: { screenId: string; name: string; locationId: string; locations: LocationOption[] }) {
  const initialState: ScreenUpdateState = { status: "idle", message: "" };
  const [state, action, pending] = useActionState(updateScreen, initialState);
  return <form action={action} className="card mb-6 p-5">
    <input type="hidden" name="screenId" value={screenId}/>
    <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
      <label className="text-sm font-semibold text-[#07172c]">Screen name<input name="name" defaultValue={name} required maxLength={100} className="mt-2 block w-full rounded-lg border px-3 py-2 font-normal"/></label>
      <label className="text-sm font-semibold text-[#07172c]">Site<select name="locationId" defaultValue={locationId} required className="mt-2 block w-full rounded-lg border bg-white px-3 py-2 font-normal">{locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}</select></label>
      <button disabled={pending} className="flex items-center justify-center gap-2 rounded-xl bg-[#07172c] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"><Save size={17}/>{pending ? "Saving…" : "Save screen"}</button>
    </div>
    {state.message && <p role="status" className={`mt-4 text-sm ${state.status === "error" ? "text-rose-700" : "text-emerald-700"}`}>{state.message}</p>}
  </form>;
}
