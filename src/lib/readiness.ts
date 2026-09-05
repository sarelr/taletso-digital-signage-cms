export function configurationReadinessIssues(environment: Record<string, string | undefined>) {
  const issues = ["DATABASE_URL", "AUTH_SECRET", "AUTH_URL"]
    .filter((name) => !environment[name] || environment[name]?.includes("replace-me") || environment[name]?.includes("example.org"));
  const xiboMode = environment.XIBO_MODE ?? "mock";
  const externalAccess = environment.TDCP_EXTERNAL_ACCESS === "true";
  const authUrl = environment.AUTH_URL ?? environment.NEXTAUTH_URL ?? "";

  if (externalAccess && !authUrl.startsWith("https://")) issues.push("HTTPS AUTH_URL for external access");
  if (externalAccess && environment.AUTH_TRUST_HOST !== "true") issues.push("AUTH_TRUST_HOST for reverse proxy");
  if (!new Set(["mock", "live"]).has(xiboMode)) issues.push("valid XIBO_MODE");
  if (xiboMode === "live") {
    issues.push(...["XIBO_BASE_URL", "XIBO_CLIENT_ID", "XIBO_CLIENT_SECRET"]
      .filter((name) => !environment[name] || environment[name]?.includes("replace-me") || environment[name]?.includes("example.org")));
  }

  return { issues, externalAccess, xiboMode };
}
