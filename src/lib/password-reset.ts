import { createHash, randomBytes } from "node:crypto";
import { hash } from "bcryptjs";
import nodemailer from "nodemailer";
import { getDb } from "@/lib/db";

const RESET_TTL_MS = 30 * 60 * 1000;
const REQUEST_COOLDOWN_MS = 60 * 1000;

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function appBaseUrl() {
  const configured = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL;
  if (!configured) throw new Error("AUTH_URL is required to create password reset links.");
  return new URL(configured).origin;
}

function mailTransport() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT ?? "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !Number.isInteger(port) || !user || !pass || !process.env.SMTP_FROM) {
    throw new Error("SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD and SMTP_FROM must be configured.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });
}

async function sendWinSmsReset(mobileNumber: string, resetUrl: URL, clientMessageId: string) {
  const apiKey = process.env.WINSMS_API_KEY;
  if (!apiKey) return false;
  const message = `Taletso password reset: ${resetUrl.toString()} Expires in 30 minutes.`;
  const response = await fetch("https://api.winsms.co.za/api/rest/v1/sms/outgoing/send", {
    method: "POST",
    headers: { AUTHORIZATION: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({ message, recipients: [{ mobileNumber, clientMessageId }], maxSegments: 2 }),
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`WinSMS rejected the reset request (${response.status}).`);
  return true;
}

export async function requestPasswordReset(email: string) {
  const db = getDb();
  const user = await db.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, name: true, mobileNumber: true },
  });
  if (!user) return;

  const recent = await db.passwordResetToken.findFirst({
    where: { userId: user.id, requestedAt: { gt: new Date(Date.now() - REQUEST_COOLDOWN_MS) } },
    select: { id: true },
  });
  if (recent) return;

  if (process.env.WINSMS_API_KEY && !user.mobileNumber) return;

  const rawToken = randomBytes(32).toString("base64url");
  const resetToken = await db.passwordResetToken.create({
    data: {
      tokenHash: tokenHash(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    },
  });

  const resetUrl = new URL("/reset-password", appBaseUrl());
  resetUrl.searchParams.set("token", rawToken);

  try {
    if (user.mobileNumber && await sendWinSmsReset(user.mobileNumber, resetUrl, resetToken.id)) return;
    await mailTransport().sendMail({
      from: process.env.SMTP_FROM,
      to: user.email,
      subject: "Reset your Taletso Digital Communications password",
      text: `Hello ${user.name ?? "there"},\n\nUse this link to reset your password. It expires in 30 minutes and can be used once:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this message.`,
      html: `<p>Hello,</p><p>Use the link below to reset your password. It expires in 30 minutes and can be used once.</p><p><a href="${resetUrl.toString().replaceAll("&", "&amp;")}">Reset password</a></p><p>If you did not request this, you can ignore this message.</p>`,
    });
  } catch (error) {
    await db.passwordResetToken.delete({ where: { id: resetToken.id } }).catch(() => undefined);
    throw error;
  }
}

export async function resetPassword(token: string, password: string) {
  const db = getDb();
  const record = await db.passwordResetToken.findUnique({
    where: { tokenHash: tokenHash(token) },
    select: { id: true, userId: true, expiresAt: true, usedAt: true },
  });
  if (!record || record.usedAt || record.expiresAt <= new Date()) return false;

  const passwordHash = await hash(password, 12);
  const updated = await db.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    if (consumed.count !== 1) return false;
    await tx.user.update({ where: { id: record.userId }, data: { passwordHash } });
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } });
    await tx.session.deleteMany({ where: { userId: record.userId } });
    return true;
  });
  return updated;
}
