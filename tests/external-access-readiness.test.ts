import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { configurationReadinessIssues } from "../src/lib/readiness.ts";

const baseEnvironment = {
  DATABASE_URL: "postgresql://tdcp_app:private@database.internal:5432/tdcp_cms",
  AUTH_SECRET: "a-private-secret",
  AUTH_URL: "http://tdcp.internal:8083",
  XIBO_MODE: "mock",
};

test("LAN-only readiness permits an internal HTTP origin", () => {
  assert.deepEqual(configurationReadinessIssues(baseEnvironment).issues, []);
});

test("external access fails closed without HTTPS and trusted proxy handling", () => {
  const result = configurationReadinessIssues({ ...baseEnvironment, TDCP_EXTERNAL_ACCESS: "true" });
  assert.ok(result.issues.includes("HTTPS AUTH_URL for external access"));
  assert.ok(result.issues.includes("AUTH_TRUST_HOST for reverse proxy"));
});

test("external access is ready only with HTTPS and trusted proxy handling", () => {
  const result = configurationReadinessIssues({
    ...baseEnvironment,
    AUTH_URL: "https://tdcp.example.test",
    AUTH_TRUST_HOST: "true",
    TDCP_EXTERNAL_ACCESS: "true",
  });
  assert.deepEqual(result.issues, []);
});

test("candidate player surfaces rejected heartbeats and recommissioning conflicts", async () => {
  const player = await readFile(new URL("../player/phase2-candidate/index.html", import.meta.url), "utf8");
  assert.match(player, /if \(!response\.ok\)/);
  assert.match(player, /DEVICE RECOMMISSION REQUIRED/);
  assert.match(player, /response\.status === 409/);
});
