"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { requireSession } from "../auth-helpers";
import { doctorSelfUpdateSchema, reviewSchema } from "../validation";
import { UserRole } from "../enums";
import type { FormState } from "../form";

export async function updateOwnDoctorProfileAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();
  if (session.user.role !== UserRole.DOCTOR && session.user.role !== UserRole.ADMIN) {
    return { ok: false, message: "Only doctors can edit a doctor profile." };
  }

  const doctor = await prisma.doctor.findUnique({
    where: { userId: Number(session.user.id) },
  });
  if (!doctor) return { ok: false, message: "Doctor profile not found." };

  const parsed = doctorSelfUpdateSchema.safeParse({
    fullName: formData.get("fullName") || undefined,
    gender: formData.get("gender") || undefined,
    bmdcNumber: formData.get("bmdcNumber") || undefined,
    experienceYears: formData.get("experienceYears") || undefined,
    consultationFee: formData.get("consultationFee") || undefined,
    about: formData.get("about") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    facebook: formData.get("facebook") || undefined,
    linkedin: formData.get("linkedin") || undefined,
    hospitalName: formData.get("hospitalName") || undefined,
    chamberAddress: formData.get("chamberAddress") || undefined,
    city: formData.get("city") || undefined,
    area: formData.get("area") || undefined,
    specialtyId: formData.get("specialtyId") || undefined,
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const data = parsed.data;
  await prisma.doctor.update({
    where: { id: doctor.id },
    data: {
      fullName: data.fullName ?? doctor.fullName,
      gender: data.gender ?? null,
      bmdcNumber: data.bmdcNumber || null,
      experienceYears: data.experienceYears ?? null,
      consultationFee: data.consultationFee ?? null,
      about: data.about || null,
      phone: data.phone || null,
      email: data.email || null,
      website: data.website || null,
      facebook: data.facebook || null,
      linkedin: data.linkedin || null,
      hospitalName: data.hospitalName || null,
      chamberAddress: data.chamberAddress || null,
      city: data.city || null,
      area: data.area || null,
      specialtyId: data.specialtyId ?? null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/doctor/${doctor.slug}`);
  redirect("/dashboard?saved=1");
}

export async function createReviewAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const session = await requireSession();

  const parsed = reviewSchema.safeParse({
    doctorId: formData.get("doctorId"),
    rating: formData.get("rating"),
    comment: formData.get("comment") || undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const k = issue.path[0];
      if (typeof k === "string") fieldErrors[k] = issue.message;
    }
    return { ok: false, message: "Please fix the errors below.", fieldErrors };
  }

  const existing = await prisma.review.findFirst({
    where: { doctorId: parsed.data.doctorId, userId: Number(session.user.id) },
  });
  if (existing) {
    return { ok: false, message: "You have already reviewed this doctor." };
  }

  await prisma.review.create({
    data: {
      doctorId: parsed.data.doctorId,
      userId: Number(session.user.id),
      rating: parsed.data.rating,
      comment: parsed.data.comment || null,
      isApproved: false,
    },
  });

  revalidatePath(`/doctor`);
  redirect(`/search?saved=1`);
}

export async function deleteOwnReviewAction(formData: FormData): Promise<void> {
  const session = await requireSession();
  const reviewId = Number(formData.get("reviewId"));
  if (!Number.isFinite(reviewId)) return;
  await prisma.review.deleteMany({
    where: { id: reviewId, userId: Number(session.user.id) },
  });
  revalidatePath("/dashboard");
}
