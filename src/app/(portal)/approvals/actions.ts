"use server";

import { ApprovalDecision, ContentStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireCurrentUser } from "@/lib/current-user";
import { CAMPUS_SCOPED_ROLES, canApproveContent } from "@/lib/access";

async function decide(formData: FormData, decision: ApprovalDecision) {
  const user = await requireCurrentUser();
  const contentId = z.string().min(1).parse(formData.get("contentId"));
  const comment = z.string().max(500).optional().parse(formData.get("comment") || undefined);

  const content = await db.content.findUnique({ where: { id: contentId } });
  if (!content || content.status !== ContentStatus.PENDING_APPROVAL) throw new Error("Content is not awaiting approval");
  if (!canApproveContent(user.id, content.ownerId, user.permissionKeys)) throw new Error("Four-eye approval policy prevents this action");
  if (CAMPUS_SCOPED_ROLES.has(user.role.name) && content.locationId !== user.locationId) throw new Error("Content is outside your campus scope");

  await db.$transaction([
    db.approval.create({
      data: {
        contentId,
        approverId: user.id,
        decision,
        comment: comment || null,
        decidedAt: new Date(),
      },
    }),
    db.content.update({
      where: { id: contentId },
      data: { status: decision === ApprovalDecision.APPROVED ? ContentStatus.APPROVED : ContentStatus.DRAFT },
    }),
    db.audit.create({
      data: {
        action: decision === ApprovalDecision.APPROVED ? "content.approved" : "content.rejected",
        entityType: "Content",
        entityId: contentId,
        actorId: user.id,
        metadata: comment ? { comment } : undefined,
      },
    }),
  ]);

  revalidatePath("/approvals");
  revalidatePath("/content");
  revalidatePath("/");
}

export async function approveContent(formData: FormData) {
  return decide(formData, ApprovalDecision.APPROVED);
}

export async function rejectContent(formData: FormData) {
  return decide(formData, ApprovalDecision.REJECTED);
}
