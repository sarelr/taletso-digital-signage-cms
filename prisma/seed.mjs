import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";
import { initialLocations, managedScreenIds } from "./seed-estate.mjs";

const db = new PrismaClient();

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password || password.length < 12 || password.startsWith("replace-")) {
    throw new Error("Set a real SEED_ADMIN_EMAIL and a unique SEED_ADMIN_PASSWORD of at least 12 characters.");
  }

  const organisation = await db.organisation.findFirst({ where: { name: "Taletso TVET College" } })
    ?? await db.organisation.create({ data: { name: "Taletso TVET College" } });
  const locations = new Map();
  for (const item of initialLocations) {
    const location = await db.location.upsert({
      where: { code: item.code },
      update: { name: item.name, organisationId: organisation.id },
      create: { ...item, organisationId: organisation.id },
    });
    locations.set(item.code, location);
  }
  const location = locations.get("PILOT");
  const unassignedLocation = locations.get("UNASSIGNED");
  if (!location || !unassignedLocation) throw new Error("The initial TDCP locations were not created.");
  const commissioningPermission = await db.permission.upsert({
    where: { key: "commissioning.update" },
    update: { description: "Create and update TV commissioning evidence" },
    create: { key: "commissioning.update", description: "Create and update TV commissioning evidence" },
  });
  const publishingPermission = await db.permission.upsert({
    where: { key: "screen.publish" },
    update: { description: "Publish approved media to authorized screens" },
    create: { key: "screen.publish", description: "Publish approved media to authorized screens" },
  });
  const mediaPermission = await db.permission.upsert({
    where: { key: "media.upload" },
    update: { description: "Upload validated media to the TDCP library" },
    create: { key: "media.upload", description: "Upload validated media to the TDCP library" },
  });
  const mediaDeletePermission = await db.permission.upsert({
    where: { key: "media.delete" },
    update: { description: "Delete unused uploaded media from the TDCP library" },
    create: { key: "media.delete", description: "Delete unused uploaded media from the TDCP library" },
  });
  const screenManagementPermission = await db.permission.upsert({
    where: { key: "screen.manage" },
    update: { description: "Register, name and assign screens to authorized sites" },
    create: { key: "screen.manage", description: "Register, name and assign screens to authorized sites" },
  });
  const additionalPermissions = [];
  for (const item of [
    { key: "content.approve", description: "Approve or reject submitted content" },
    { key: "users.manage", description: "Create and manage TDCP user accounts" },
    { key: "scheduling.manage", description: "Create and activate content schedules" },
    { key: "playlist.manage", description: "Create and manage content playlists" },
    { key: "readiness.update", description: "Update campus and site readiness evidence" },
  ]) {
    additionalPermissions.push(await db.permission.upsert({
      where: { key: item.key },
      update: { description: item.description },
      create: item,
    }));
  }
  const role = await db.role.upsert({
    where: { name: "Taletso Super Administrator" },
    update: {},
    create: { name: "Taletso Super Administrator" },
  });
  await db.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: commissioningPermission.id } },
    update: {},
    create: { roleId: role.id, permissionId: commissioningPermission.id },
  });
  for (const permission of additionalPermissions) {
    await db.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
      update: {},
      create: { roleId: role.id, permissionId: permission.id },
    });
  }
  await db.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: screenManagementPermission.id } },
    update: {},
    create: { roleId: role.id, permissionId: screenManagementPermission.id },
  });
  await db.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: mediaPermission.id } },
    update: {},
    create: { roleId: role.id, permissionId: mediaPermission.id },
  });
  await db.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: mediaDeletePermission.id } },
    update: {},
    create: { roleId: role.id, permissionId: mediaDeletePermission.id },
  });
  await db.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: role.id, permissionId: publishingPermission.id } },
    update: {},
    create: { roleId: role.id, permissionId: publishingPermission.id },
  });
  const existingAdministrator = await db.user.findUnique({ where: { email } });
  const administrator = existingAdministrator
    ? await db.user.update({ where: { id: existingAdministrator.id }, data: { organisationId: organisation.id, roleId: role.id, name: existingAdministrator.name ?? "Taletso Administrator", ...(existingAdministrator.passwordHash ? {} : { passwordHash: await hash(password, 12) }) } })
    : await db.user.create({ data: { email, passwordHash: await hash(password, 12), organisationId: organisation.id, roleId: role.id, name: "Taletso Administrator" } });
  const pilot = await db.screen.findFirst({ where: { OR: [{ externalId: "SCREEN-001" }, { name: "PILOT-TV-01", locationId: location.id }] } });
  const screen = pilot
    ? await db.screen.update({ where: { id: pilot.id }, data: { externalId: "SCREEN-001", name: "TDCP Pilot Screen", locationId: location.id } })
    : await db.screen.create({ data: { externalId: "SCREEN-001", name: "TDCP Pilot Screen", locationId: location.id } });
  for (const externalId of managedScreenIds.slice(1)) {
    await db.screen.upsert({
      where: { externalId },
      update: {},
      create: { externalId, name: `TDCP Screen ${externalId.slice(-3)}`, locationId: unassignedLocation.id },
    });
  }

  const media = [
    { title: "Taletso TVET College Welcome", originalFilename: "taletso-welcome.svg", mimeType: "image/svg+xml", fileSize: 2100, url: "media/taletso-welcome.svg" },
    { title: "TDCP Test Screen", originalFilename: "test-screen.svg", mimeType: "image/svg+xml", fileSize: 1072, url: "media/test-screen.svg" },
    { title: "Remote Content Change Successful", originalFilename: "test-screen-2.svg", mimeType: "image/svg+xml", fileSize: 1125, url: "media/test-screen-2.svg" },
  ];
  for (const item of media) {
    const existing = await db.content.findFirst({ where: { url: item.url } });
    if (existing) await db.content.update({ where: { id: existing.id }, data: { ...item, type: "IMAGE", status: "APPROVED", ownerId: administrator.id } });
    else await db.content.create({ data: { ...item, type: "IMAGE", status: "APPROVED", ownerId: administrator.id } });
  }

  const current = await db.content.findFirst({ where: { url: "media/test-screen-2.svg" } });
  if (current && !screen.currentContentId) await db.screen.update({ where: { id: screen.id }, data: { currentContentId: current.id } });
}

main().finally(() => db.$disconnect());
