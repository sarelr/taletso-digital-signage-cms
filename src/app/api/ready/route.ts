import { getDb } from "@/lib/db";
import { configurationReadinessIssues } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const { issues: missing, externalAccess, xiboMode } = configurationReadinessIssues(process.env);

  try {
    await getDb().$queryRaw`SELECT 1`;
  } catch (error) {
    console.error("[ready] database check failed", { error });
    missing.push("database connectivity");
  }

  return Response.json(
    { status: missing.length === 0 ? "ready" : "not_ready", checks: { database: !missing.includes("database connectivity"), configuration: missing.length === 0, externalAccess, xiboMode }, missing },
    { status: missing.length === 0 ? 200 : 503 },
  );
}
