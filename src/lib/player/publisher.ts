import { constants } from "node:fs";
import { access, copyFile, mkdir, open, readFile, rename, rm } from "node:fs/promises";
import path from "node:path";
import { validatePlayerConfiguration, type PlayerConfiguration } from "./configuration.ts";

export type PublishedFile = { targetPath: string; backupPath: string | null };

export function playerRoot(): string {
  return path.resolve(process.env.TDCP_PLAYER_ROOT || path.join(process.cwd(), "runtime", "player-sandbox"));
}

function backupRoot(): string {
  return path.resolve(process.env.TDCP_BACKUP_ROOT || path.join(process.cwd(), "runtime", "backups"));
}

function screenFilename(screenId: string) {
  return `${screenId.toLowerCase()}.json`;
}

async function atomicCopy(source: string, target: string, version: string) {
  const temporary = `${target}.${version}.restore.tmp`;
  await copyFile(source, temporary, constants.COPYFILE_EXCL);
  try { await rename(temporary, target); }
  catch (error) { await rm(temporary, { force: true }); throw error; }
}

export async function publishPlayerConfiguration(configuration: PlayerConfiguration): Promise<PublishedFile> {
  const valid = validatePlayerConfiguration(configuration);
  const root = playerRoot();
  const mediaPath = path.resolve(root, valid.media);
  if (!mediaPath.startsWith(`${root}${path.sep}`)) throw new Error("Media path escapes the player directory.");
  await access(mediaPath, constants.R_OK);

  const backups = backupRoot();
  const lockDirectory = path.join(backups, "locks");
  const configurationDirectory = path.join(backups, "screen-configurations");
  await Promise.all([mkdir(lockDirectory, { recursive: true }), mkdir(configurationDirectory, { recursive: true })]);
  const lockPath = path.join(lockDirectory, `${valid.screenId.toLowerCase()}.lock`);
  let lock;
  try { lock = await open(lockPath, "wx", 0o640); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === "EEXIST") throw new Error("Another publication is already in progress for this screen.");
    throw error;
  }

  const targetPath = path.join(root, screenFilename(valid.screenId));
  const temporaryPath = `${targetPath}.${valid.configurationVersion}.tmp`;
  let backupPath: string | null = null;
  try {
    try {
      const previous = JSON.parse(await readFile(targetPath, "utf8"));
      validatePlayerConfiguration(previous, true);
      backupPath = path.join(configurationDirectory, `${valid.screenId.toLowerCase()}-${Date.now()}-${valid.configurationVersion}.json`);
      await copyFile(targetPath, backupPath, constants.COPYFILE_EXCL);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw new Error("Existing player configuration is invalid; publication stopped without replacing it.");
    }

    const temporary = await open(temporaryPath, "wx", 0o640);
    try {
      await temporary.writeFile(`${JSON.stringify(valid, null, 2)}\n`, "utf8");
      await temporary.sync();
    } finally { await temporary.close(); }
    try { await rename(temporaryPath, targetPath); }
    catch (error) { await rm(temporaryPath, { force: true }); throw error; }
    return { targetPath, backupPath };
  } finally {
    await lock.close();
    await rm(lockPath, { force: true });
  }
}

export async function restorePublishedFile(file: PublishedFile, version: string): Promise<void> {
  if (file.backupPath) await atomicCopy(file.backupPath, file.targetPath, version);
  else await rm(file.targetPath, { force: true });
}
