"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { requireSession } from "../auth-helpers";
import { claimCreateSchema } from "../validation";
import type { FormState } from "../form";

export async function createClaimAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  const parsed = claimCreateSchema.safeParse({
    doctorId: formData.get("doctorId"),
    bmdcNumber: formData.get("bmdcNumber") || undefined,
    licenseImage: formData.get("licenseImage") || undefined,
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const doctor = await prisma.doctor.findUnique({ where: { id: parsed.data.doctorId } });
  if (!doctor) return { ok: false, message: "Doctor not found." };
  if (doctor.profileClaimed) {
    return { ok: false, message: "This profile is already claimed." };
  }

  const existingDoctor = await prisma.doctor.findUnique({
    where: { userId: Number(session.user.id) },
  });
  if (existingDoctor) {
    return { ok: false, message: "You already have a linked doctor profile." };
  }

  const existing = await prisma.doctorClaim.findFirst({
    where: { doctorId: parsed.data.doctorId, status: "PENDING" },
  });
  if (existing) {
    return { ok: false, message: "A pending claim already exists for this profile." };
  }

  await prisma.doctorClaim.create({
    data: {
      doctorId: parsed.data.doctorId,
      userId: Number(session.user.id),
      bmdcNumber: parsed.data.bmdcNumber || null,
      licenseImage: parsed.data.licenseImage || null,
      note: parsed.data.note || null,
    },
  });
  revalidatePath("/admin/claims");
  redirect("/dashboard?claim=1");
}
