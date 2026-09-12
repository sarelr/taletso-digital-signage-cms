import assert from "node:assert/strict";
import test from "node:test";
import { base44ContentSchema, validIntegrationSecret } from "../src/lib/integrations/base44.ts";

test("accepts a supported Base44 content reference", () => {
  assert.equal(base44ContentSchema.safeParse({ sourceType: "Announcement", sourceId: "announcement-1", title: "Registration closes Friday", url: "https://example.test/announcements/announcement-1", mediaType: "WEBPAGE", sourceUpdatedAt: "2026-09-11T08:30:00+02:00" }).success, true);
});

test("rejects unsupported records and extra fields", () => {
  assert.equal(base44ContentSchema.safeParse({ sourceType: "User", sourceId: "1", title: "No", url: "https://example.test", mediaType: "WEBPAGE" }).success, false);
  assert.equal(base44ContentSchema.safeParse({ sourceType: "Announcement", sourceId: "1", title: "No", url: "https://example.test", mediaType: "WEBPAGE", secret: "leak" }).success, false);
});

test("requires an exact, sufficiently long bearer secret", () => {
  const secret = "a".repeat(32);
  assert.equal(validIntegrationSecret(`Bearer ${secret}`, secret), true);
  assert.equal(validIntegrationSecret("Bearer wrong", secret), false);
  assert.equal(validIntegrationSecret(`Bearer ${secret}`, "short"), false);
});
