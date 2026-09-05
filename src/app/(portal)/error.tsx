"use client";

export default function PortalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="p-5 lg:p-8">
      <section className="card max-w-2xl p-6">
        <h1 className="text-xl font-bold text-[#07172c]">The workspace could not be loaded</h1>
        <p className="mt-2 text-sm text-slate-500">No changes were made. Check the database connection and try again.</p>
        <button type="button" onClick={reset} className="mt-5 rounded-xl bg-[#07172c] px-4 py-2.5 text-sm font-bold text-white">Try again</button>
      </section>
    </div>
  );
}
