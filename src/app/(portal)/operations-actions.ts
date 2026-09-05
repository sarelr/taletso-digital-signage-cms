"use server";

import { ApprovalDecision, ContentStatus, ReadinessStatus, ScheduleStatus, type Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

async function actorWithPermission(permission: string) {
  const session = await auth();
  if (!session?.user?.email) throw new Error("Sign in again.");
  const actor = await getDb().user.findUnique({ where: { email: session.user.email.toLowerCase() }, include: { role: { include: { permissions: { include: { permission: true } } } } } });
  if (!actor || !actor.role.permissions.some(({ permission: item }) => item.key === permission)) throw new Error("Permission denied.");
  return actor;
}

async function audit(action: string, entityType: string, entityId: string, actorId: string, metadata?: Prisma.InputJsonValue) {
  await getDb().audit.create({ data: { action, entityType, entityId, actorId, metadata } });
}

export async function decideApproval(formData: FormData) {
  const actor = await actorWithPermission("content.approve");
  const contentId = String(formData.get("contentId") ?? "");
  const decision = String(formData.get("decision")) as ApprovalDecision;
  if (decision !== ApprovalDecision.APPROVED && decision !== ApprovalDecision.REJECTED) throw new Error("Invalid decision.");
  const content = await getDb().content.findUnique({ where: { id: contentId } });
  if (!content || content.ownerId === actor.id) throw new Error("Contributors cannot approve their own content.");
  const approval = await getDb().approval.create({ data: { contentId, approverId: actor.id, decision, comment: String(formData.get("comment") ?? "").slice(0, 500) || null, decidedAt: new Date() } });
  await getDb().content.update({ where: { id: contentId }, data: { status: decision === ApprovalDecision.APPROVED ? ContentStatus.APPROVED : ContentStatus.DRAFT } });
  await audit("content.approval.decided", "Approval", approval.id, actor.id, { contentId, decision });
  revalidatePath("/approvals"); revalidatePath("/content");
}

export async function createUser(formData: FormData) {
  const actor = await actorWithPermission("users.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const mobileNumber = normalizeSouthAfricanMobile(String(formData.get("mobileNumber") ?? ""));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const roleId = String(formData.get("roleId") ?? "");
  const locationId = String(formData.get("locationId") ?? "") || null;
  if (!email.includes("@") || password.length < 12 || !name || !roleId || !mobileNumber) throw new Error("Name, valid email, South African mobile number, role and a 12-character password are required.");
  const user = await getDb().user.create({ data: { email, name, mobileNumber, passwordHash: await hash(password, 12), roleId, locationId, organisationId: actor.organisationId } });
  await audit("user.created", "User", user.id, actor.id, { email, mobileNumber, roleId, locationId });
  revalidatePath("/users");
}

function normalizeSouthAfricanMobile(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^0/, "27");
  return /^27[1-9]\d{8}$/.test(digits) ? digits : null;
}

export async function updateUserMobile(formData: FormData) {
  const actor = await actorWithPermission("users.manage");
  const userId = String(formData.get("userId") ?? "");
  const mobileNumber = normalizeSouthAfricanMobile(String(formData.get("mobileNumber") ?? ""));
  if (!userId || !mobileNumber) throw new Error("Enter a valid South African mobile number.");
  await getDb().user.update({ where: { id: userId }, data: { mobileNumber } });
  await audit("user.mobile.updated", "User", userId, actor.id, { mobileNumber });
  revalidatePath("/users");
}

export async function createPlaylist(formData: FormData) {
  const actor = await actorWithPermission("playlist.manage");
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Playlist name is required.");
  const playlist = await getDb().playlist.create({ data: { name, description: String(formData.get("description") ?? "").trim() || null } });
  await audit("playlist.created", "Playlist", playlist.id, actor.id, { name });
  revalidatePath("/playlists");
}

export async function createSchedule(formData: FormData) {
  const actor = await actorWithPermission("scheduling.manage");
  const name = String(formData.get("name") ?? "").trim();
  const startsAt = new Date(String(formData.get("startsAt") ?? ""));
  const endsAt = new Date(String(formData.get("endsAt") ?? ""));
  const playlistId = String(formData.get("playlistId") ?? "");
  const screenGroupId = String(formData.get("screenGroupId") ?? "");
  if (!name || !playlistId || !screenGroupId || Number.isNaN(+startsAt) || Number.isNaN(+endsAt) || endsAt <= startsAt) throw new Error("Provide a name, targets and a valid start/end window.");
  const schedule = await getDb().schedule.create({ data: { name, startsAt, endsAt, playlistId, screenGroupId, status: ScheduleStatus.DRAFT } });
  await audit("schedule.created", "Schedule", schedule.id, actor.id, { name });
  revalidatePath("/scheduling");
}

export async function updateScheduleStatus(formData: FormData) {
  const actor = await actorWithPermission("scheduling.manage");
  const id = String(formData.get("id")); const status = String(formData.get("status")) as ScheduleStatus;
  if (!Object.values(ScheduleStatus).includes(status)) throw new Error("Invalid schedule status.");
  await getDb().schedule.update({ where: { id }, data: { status } });
  await audit("schedule.status.updated", "Schedule", id, actor.id, { status }); revalidatePath("/scheduling");
}

export async function saveReadiness(formData: FormData) {
  const actor = await actorWithPermission("readiness.update");
  const locationId = String(formData.get("locationId"));
  const status = (key: string) => String(formData.get(key)) as ReadinessStatus;
  const data = { power: status("power"), network: status("network"), mounting: status("mounting"), player: status("player"), notes: String(formData.get("notes") ?? "").slice(0, 1000) || null };
  if (!locationId || [data.power, data.network, data.mounting, data.player].some(value => !Object.values(ReadinessStatus).includes(value))) throw new Error("Invalid readiness data.");
  const record = await getDb().siteReadiness.upsert({ where: { locationId }, create: { locationId, ...data }, update: data });
  await audit("site.readiness.updated", "SiteReadiness", record.id, actor.id, { locationId }); revalidatePath("/readiness");
}
