"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { getDb } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(12),
  roleId: z.string().min(1),
  locationId: z.string().optional(),
});

export async function createUser(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const db = getDb();
  const actor = await db.user.findUnique({
    where: { id: session.user.id },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  if (!actor) throw new Error("Unauthorized");
  if (!actor.role.permissions.some((item) => item.permission.key === "users.manage")) throw new Error("Forbidden");

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error("Invalid user data");
  const role = await db.role.findUnique({ where: { id: parsed.data.roleId } });
  if (!role) throw new Error("Role not found");

  const campusScoped = ["Campus Content Manager", "Contributor", "Approver", "Viewer"].includes(role.name);
  const locationId = parsed.data.locationId || null;
  if (campusScoped && !locationId) throw new Error("Campus-scoped roles require a campus");

  const organisation = await db.organisation.findFirst({ orderBy: { createdAt: "asc" } });
  if (!organisation) throw new Error("Organisation not configured");
  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const user = await db.user.create({
    data: { name: parsed.data.name, email: parsed.data.email, passwordHash, roleId: role.id, locationId, organisationId: organisation.id },
  });
  await db.audit.create({ data: { action: "user.created", entityType: "User", entityId: user.id, actorId: actor.id, metadata: { role: role.name, locationId } } });
  revalidatePath("/users");
}
