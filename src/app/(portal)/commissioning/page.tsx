import { CommissioningChecklist } from "@/components/commissioning-checklist";
import { getDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function CommissioningPage({ searchParams }: { searchParams: Promise<{ screen?: string }> }) {
  const { screen: requestedScreen } = await searchParams;
  const screens = await getDb().screen.findMany({ orderBy: { externalId: "asc" }, select: { externalId: true, name: true } });
  const selectedScreen = requestedScreen ?? "SCREEN-001";
  const screen = await getDb().screen.findFirst({
    where: { externalId: selectedScreen },
    include: { commissioning: true, location: true },
  });

  if (!screen) {
    return (
      <div className="p-5 lg:p-8">
        <section className="card max-w-2xl p-6">
          <h1 className="text-xl font-bold text-[#07172c]">Screen record is not initialized</h1>
          <p className="mt-2 text-sm text-slate-500">Run the production seed after applying migrations, then reload this page.</p>
        </section>
      </div>
    );
  }

  const record = screen.commissioning;
  return <div className="p-5 lg:p-8"><form className="card mb-5 flex flex-wrap items-end gap-3 p-4" method="get">
    <label className="min-w-64 flex-1 text-sm font-semibold">Select screen<select name="screen" defaultValue={selectedScreen} className="mt-2 w-full rounded-xl border border-slate-300 p-3">
      {screens.map((item) => <option key={item.externalId} value={item.externalId ?? ""}>{item.externalId} — {item.name}</option>)}
    </select></label><button className="rounded-xl bg-[#07172c] px-5 py-3 font-semibold text-white">Open commissioning record</button>
  </form><CommissioningChecklist initial={{
    screenId: screen.id,
    screenName: screen.name,
    location: screen.location.name,
    status: record?.status ?? "PLANNED",
    manufacturer: record?.manufacturer ?? "",
    modelNumber: record?.modelNumber ?? "",
    serialNumber: record?.serialNumber ?? "",
    assetTag: record?.assetTag ?? "",
    macAddress: record?.macAddress ?? "",
    playerType: record?.playerType ?? "",
    playerIdentifier: record?.playerIdentifier ?? "",
    resolution: record?.resolution ?? "1920x1080",
    orientation: record?.orientation ?? "LANDSCAPE",
    evidenceReference: record?.evidenceReference ?? "",
    blockerNotes: record?.blockerNotes ?? "",
    identityVerified: record?.identityVerified ?? false,
    powerVerified: record?.powerVerified ?? false,
    networkVerified: record?.networkVerified ?? false,
    playerVerified: record?.playerVerified ?? false,
    displayVerified: record?.displayVerified ?? false,
    xiboPaired: record?.xiboPaired ?? false,
    testContentVerified: record?.testContentVerified ?? false,
    handoverVerified: record?.handoverVerified ?? false,
  }} /></div>;
}
