"use server";

import { CommissioningStatus, DisplayOrientation, type Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { CAMPUS_SCOPED_ROLES } from "@/lib/access";
import { getDb } from "@/lib/db";

export type CommissioningActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

const optionalText = z.string().trim().max(255).transform((value) => value || null);
const notesText = z.string().trim().max(2_000).transform((value) => value || null);
const commissioningSchema = z.object({
  screenId: z.string().cuid(),
  manufacturer: optionalText,
  modelNumber: optionalText,
  serialNumber: optionalText,
  assetTag: optionalText,
  macAddress: optionalText,
  playerType: optionalText,
  playerIdentifier: optionalText,
  resolution: optionalText,
  orientation: z.nativeEnum(DisplayOrientation),
  evidenceReference: notesText,
  blockerNotes: notesText,
});

const verificationFields = [
  "identityVerified",
  "powerVerified",
  "networkVerified",
  "playerVerified",
  "displayVerified",
  "xiboPaired",
  "testContentVerified",
  "handoverVerified",
] as const;

function withoutScreenId<T extends { screenId: string }>(input: T): Omit<T, "screenId"> {
  const output = { ...input };
  Reflect.deleteProperty(output, "screenId");
  return output;
}

export async function saveCommissioning(
  _previousState: CommissioningActionState,
  formData: FormData,
): Promise<CommissioningActionState> {
  const session = await auth();
  if (!session?.user?.email) return { status: "error", message: "Your session has expired. Sign in again." };

  const parsed = commissioningSchema.safeParse(Object.fromEntries([
    "screenId",
    "manufacturer",
    "modelNumber",
    "serialNumber",
    "assetTag",
    "macAddress",
    "playerType",
    "playerIdentifier",
    "resolution",
    "orientation",
    "evidenceReference",
    "blockerNotes",
  ].map((key) => [key, formData.get(key) ?? ""])));
  if (!parsed.success) return { status: "error", message: "Correct the invalid or overlong fields and try again." };

  const db = getDb();
  const actor = await db.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  const permissions = actor?.role.permissions.map(({ permission }) => permission.key) ?? [];
  if (!actor || !permissions.includes("commissioning.update")) {
    return { status: "error", message: "You do not have permission to update commissioning records." };
  }

  const screen = await db.screen.findUnique({
    where: { id: parsed.data.screenId },
    include: { location: true, commissioning: true },
  });
  if (!screen || screen.location.organisationId !== actor.organisationId) {
    return { status: "error", message: "The selected screen is outside your organisation." };
  }
  if (CAMPUS_SCOPED_ROLES.has(actor.role.name) && actor.locationId !== screen.locationId) {
    return { status: "error", message: "The selected screen is outside your assigned campus." };
  }

  const checks = Object.fromEntries(
    verificationFields.map((field) => [field, formData.get(field) === "on"]),
  ) as Record<(typeof verificationFields)[number], boolean>;
  const identityComplete = Boolean(
    parsed.data.manufacturer && parsed.data.modelNumber && parsed.data.serialNumber && parsed.data.assetTag,
  );
  if (checks.identityVerified && !identityComplete) {
    return { status: "error", message: "Manufacturer, model, serial number and asset tag are required before identity can pass." };
  }
  if (checks.handoverVerified && !parsed.data.evidenceReference) {
    return { status: "error", message: "An evidence reference is required before handover can pass." };
  }

  const allPassed = verificationFields.every((field) => checks[field]);
  const anyStarted = verificationFields.some((field) => checks[field]);
  const status = parsed.data.blockerNotes
    ? CommissioningStatus.BLOCKED
    : allPassed
      ? CommissioningStatus.READY
      : anyStarted
        ? CommissioningStatus.IN_PROGRESS
        : CommissioningStatus.PLANNED;

  const recordFields = withoutScreenId(parsed.data);
  const updateData = {
    ...recordFields,
    ...checks,
    autoStartVerified: checks.playerVerified,
    status,
    commissionedAt: status === CommissioningStatus.READY ? new Date() : null,
  };
  try {
    await db.$transaction(async (transaction) => {
      const record = await transaction.screenCommissioning.upsert({
        where: { screenId: screen.id },
        create: { screenId: screen.id, ...updateData },
        update: updateData,
      });
      await transaction.audit.create({
        data: {
          action: "commissioning.updated",
          entityType: "ScreenCommissioning",
          entityId: record.id,
          actorId: actor.id,
          metadata: {
            screenId: screen.id,
            previousStatus: screen.commissioning?.status ?? null,
            status,
            verifiedControls: verificationFields.filter((field) => checks[field]),
          } satisfies Prisma.InputJsonValue,
        },
      });
    });
  } catch (error) {
    console.error("[commissioning.save] failed", { screenId: screen.id, actorId: actor.id, error });
    return { status: "error", message: "The commissioning record could not be saved. No partial update was applied." };
  }

  revalidatePath("/commissioning");
  return { status: "success", message: `Commissioning saved as ${status.toLowerCase().replaceAll("_", " ")}.` };
}
