import assert from "node:assert/strict";
import test from "node:test";
import { initialLocations, managedScreenIds } from "../prisma/seed-estate.mjs";
import { isManagedScreenId, managedScreenIds as applicationScreenIds } from "../src/lib/screen-estate.ts";

test("defines exactly twelve independently addressable screens", () => {
  assert.equal(managedScreenIds.length, 12);
  assert.equal(new Set(managedScreenIds).size, 12);
  assert.equal(managedScreenIds[0], "SCREEN-001");
  assert.equal(managedScreenIds[11], "SCREEN-012");
  assert.ok(managedScreenIds.every((id) => /^SCREEN-[0-9]{3}$/.test(id)));
  assert.deepEqual(applicationScreenIds, managedScreenIds);
  assert.equal(isManagedScreenId("SCREEN-012"), true);
  assert.equal(isManagedScreenId("SCREEN-013"), false);
  assert.equal(isManagedScreenId("SCREEN-014"), false);
});

test("seeds the four Taletso sites and a transparent unassigned holding site", () => {
  const codes = new Set(initialLocations.map((location) => location.code));
  for (const code of ["MAHIKENG", "LICHTENBURG", "LEHURUTSHE", "CENTRAL", "UNASSIGNED"]) assert.ok(codes.has(code));
});
