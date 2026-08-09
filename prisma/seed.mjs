import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const permissions = [
  ["dashboard.view", "View operational dashboard"],
  ["screens.view", "View screens"],
  ["screens.manage", "Create and manage screens"],
  ["content.view", "View content library"],
  ["content.create", "Create content"],
  ["content.approve", "Approve or reject content"],
  ["playlists.manage", "Create and manage playlists"],
  ["schedules.manage", "Create and manage schedules"],
  ["users.manage", "Manage users and access"],
  ["audit.view", "View audit logs"],
  ["readiness.manage", "Manage site readiness"],
  ["settings.manage", "Manage system settings"],
];

const rolePermissions = {
  "Cyrus Technical Administrator": permissions.map(([key]) => key),
  "Taletso Super Administrator": permissions.map(([key]) => key),
  "Communications Administrator": ["dashboard.view", "screens.view", "content.view", "content.create", "content.approve", "playlists.manage", "schedules.manage", "audit.view"],
  "Campus Content Manager": ["dashboard.view", "screens.view", "content.view", "content.create", "playlists.manage", "schedules.manage"],
  Contributor: ["dashboard.view", "screens.view", "content.view", "content.create"],
  Approver: ["dashboard.view", "screens.view", "content.view", "content.approve"],
  Viewer: ["dashboard.view", "screens.view", "content.view"],
};

async function main() {
  const organisation = await prisma.organisation.upsert({
    where: { id: "taletso-tvet" },
    update: { name: "Taletso TVET College" },
    create: { id: "taletso-tvet", name: "Taletso TVET College" },
  });

  const campusDefinitions = [
    { name: "Mahikeng Campus", code: "MAH", screens: 3 },
    { name: "Lichtenburg Campus", code: "LIC", screens: 3 },
    { name: "Lehurutshe Campus", code: "LEH", screens: 3 },
    { name: "Central Offices", code: "CTR", screens: 3 },
  ];

  for (const campus of campusDefinitions) {
    const location = await prisma.location.upsert({
      where: { code: campus.code },
      update: { name: campus.name, organisationId: organisation.id },
      create: { name: campus.name, code: campus.code, organisationId: organisation.id },
    });

    await prisma.siteReadiness.upsert({ where: { locationId: location.id }, update: {}, create: { locationId: location.id } });

    const group = await prisma.screenGroup.upsert({
      where: { name: campus.name },
      update: {},
      create: { name: campus.name },
    });

    for (let i = 1; i <= campus.screens; i += 1) {
      const externalId = `${campus.code}-DISPLAY-${String(i).padStart(2, "0")}`;
      const screen = await prisma.screen.upsert({
        where: { externalId },
        update: { name: `${campus.name} Display ${i}`, locationId: location.id },
        create: { name: `${campus.name} Display ${i}`, externalId, locationId: location.id },
      });
      await prisma.screenGroupMembership.upsert({
        where: { screenId_groupId: { screenId: screen.id, groupId: group.id } },
        update: {},
        create: { screenId: screen.id, groupId: group.id },
      });
    }
  }

  const permissionRecords = new Map();
  for (const [key, description] of permissions) {
    const permission = await prisma.permission.upsert({ where: { key }, update: { description }, create: { key, description } });
    permissionRecords.set(key, permission.id);
  }

  const roles = new Map();
  for (const [name, keys] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({ where: { name }, update: {}, create: { name } });
    roles.set(name, role.id);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    await prisma.rolePermission.createMany({ data: keys.map((key) => ({ roleId: role.id, permissionId: permissionRecords.get(key) })) });
  }

  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@taletso.edu.za").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMeImmediately!2026";
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.upsert({
    where: { email },
    update: { name: "Taletso Super Administrator", passwordHash, organisationId: organisation.id, roleId: roles.get("Taletso Super Administrator") },
    create: { email, name: "Taletso Super Administrator", passwordHash, organisationId: organisation.id, roleId: roles.get("Taletso Super Administrator") },
  });

  console.log("Seeded Taletso TVET College, 4 campus display groups and 12 screens.");
  if (!process.env.SEED_ADMIN_PASSWORD) console.warn("Using development seed password. Set SEED_ADMIN_PASSWORD before shared or production deployments.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(async () => prisma.$disconnect());
