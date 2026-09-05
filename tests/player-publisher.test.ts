import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { publishPlayerConfiguration } from "../src/lib/player/publisher.ts";
import type { PlayerConfiguration } from "../src/lib/player/configuration.ts";

async function fixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "tdcp-publisher-"));
  const player = path.join(directory, "player");
  const backups = path.join(directory, "backups");
  await mkdir(path.join(player, "media"), { recursive: true });
  await writeFile(path.join(player, "media", "test-screen.svg"), "fixture");
  process.env.TDCP_PLAYER_ROOT = player;
  process.env.TDCP_BACKUP_ROOT = backups;
  const configuration: PlayerConfiguration = {
    screenId: "SCREEN-001", name: "TDCP Pilot Screen", site: "Test Environment", status: "unknown",
    contentType: "image", media: "media/test-screen.svg", refreshSeconds: 10, configurationVersion: randomUUID(),
  };
  return { player, configuration };
}

test("writes a validated Screen 001 configuration", async () => {
  const { player, configuration } = await fixture();
  await publishPlayerConfiguration(configuration);
  assert.deepEqual(JSON.parse(await readFile(path.join(player, "screen-001.json"), "utf8")), configuration);
});

test("backs up a valid Phase 1 configuration before replacement", async () => {
  const { player, configuration } = await fixture();
  const previous = { ...configuration, status: "online" as const } as Partial<PlayerConfiguration>;
  delete previous.configurationVersion;
  await writeFile(path.join(player, "screen-001.json"), JSON.stringify(previous));
  const result = await publishPlayerConfiguration({ ...configuration, configurationVersion: randomUUID() });
  assert.ok(result.backupPath);
  assert.deepEqual(JSON.parse(await readFile(result.backupPath!, "utf8")), previous);
});

test("does not replace a malformed existing configuration", async () => {
  const { player, configuration } = await fixture();
  const target = path.join(player, "screen-001.json");
  const malformed = '{"screenId":"SCREEN-001",,}';
  await writeFile(target, malformed);
  await assert.rejects(() => publishPlayerConfiguration(configuration), /invalid/);
  assert.equal(await readFile(target, "utf8"), malformed);
});

test("rejects media paths outside the controlled media directory", async () => {
  const { configuration } = await fixture();
  await assert.rejects(() => publishPlayerConfiguration({ ...configuration, media: "../secret" }));
});
