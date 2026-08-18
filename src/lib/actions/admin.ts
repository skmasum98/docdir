"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { requireAdmin } from "../auth-helpers";
import {
  specialtySchema,
  facilitySchema,
  doctorCreateSchema,
  doctorUpdateSchema,
  divisionSchema,
  districtSchema,
  upazilaSchema,
  blogSchema,
  userUpdateSchema,
  reviewDecisionSchema,
  claimDecisionSchema,
} from "../validation";
import { UserRole } from "../enums";
import { uniqueSlug } from "../slug";
import type { FormState } from "../form";

function fieldErrorsFromZod(err: import("zod").ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path[0];
    if (typeof k === "string") fieldErrors[k] = issue.message;
  }
  return fieldErrors;
}

export async function createSpecialtyAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = specialtySchema.safeParse({ name: formData.get("name") });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  const slug = await uniqueSlug(parsed.data.name, async (s) => {
    const found = await prisma.specialty.findUnique({ where: { slug: s } });
    return Boolean(found);
  });
  await prisma.specialty.create({ data: { name: parsed.data.name, slug } });
  revalidatePath("/admin/specialties");
  revalidatePath("/search");
  redirect("/admin/specialties?saved=1");
}

export async function deleteSpecialtyAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.specialty.deleteMany({ where: { id } });
  revalidatePath("/admin/specialties");
  revalidatePath("/search");
}

export async function createDivisionAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = divisionSchema.safeParse({ name: formData.get("name") });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  const slug = await uniqueSlug(parsed.data.name, async (s) => {
    const f = await prisma.division.findUnique({ where: { slug: s } });
    return Boolean(f);
  });
  await prisma.division.create({ data: { name: parsed.data.name, slug } });
  revalidatePath("/admin/regions");
  revalidatePath("/search");
  redirect("/admin/regions?saved=1");
}

export async function deleteDivisionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.division.deleteMany({ where: { id } });
  revalidatePath("/admin/regions");
  revalidatePath("/search");
}

export async function createDistrictAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = districtSchema.safeParse({
    name: formData.get("name"),
    divisionId: formData.get("divisionId"),
  });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  const slug = await uniqueSlug(parsed.data.name, async (s) => {
    const f = await prisma.district.findFirst({
      where: { slug: s, divisionId: parsed.data.divisionId },
    });
    return Boolean(f);
  });
  await prisma.district.create({
    data: { name: parsed.data.name, divisionId: parsed.data.divisionId, slug },
  });
  revalidatePath("/admin/regions");
  revalidatePath("/search");
  redirect("/admin/regions?saved=1");
}

export async function deleteDistrictAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.district.deleteMany({ where: { id } });
  revalidatePath("/admin/regions");
  revalidatePath("/search");
}

export async function createUpazilaAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = upazilaSchema.safeParse({
    name: formData.get("name"),
    districtId: formData.get("districtId"),
  });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  const slug = await uniqueSlug(parsed.data.name, async (s) => {
    const f = await prisma.upazila.findFirst({
      where: { slug: s, districtId: parsed.data.districtId },
    });
    return Boolean(f);
  });
  await prisma.upazila.create({
    data: { name: parsed.data.name, districtId: parsed.data.districtId, slug },
  });
  revalidatePath("/admin/regions");
  revalidatePath("/search");
  redirect("/admin/regions?saved=1");
}

export async function deleteUpazilaAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.upazila.deleteMany({ where: { id } });
  revalidatePath("/admin/regions");
  revalidatePath("/search");
}

export async function createFacilityAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const parsed = facilitySchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type") || undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    upazilaId: formData.get("upazilaId"),
  });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  const slug = await uniqueSlug(parsed.data.name, async (s) => {
    const f = await prisma.facility.findUnique({ where: { slug: s } });
    return Boolean(f);
  });
  await prisma.facility.create({
    data: {
      name: parsed.data.name,
      type: parsed.data.type,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      upazilaId: parsed.data.upazilaId,
      slug,
    },
  });
  revalidatePath("/admin/facilities");
  revalidatePath("/search");
  redirect("/admin/facilities?saved=1");
}

export async function deleteFacilityAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.facility.deleteMany({ where: { id } });
  revalidatePath("/admin/facilities");
  revalidatePath("/search");
}

export async function createDoctorAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const facilityIds = formData.getAll("facilityIds").map((v) => Number(v)).filter(Boolean);
  const parsed = doctorCreateSchema.safeParse({
    fullName: formData.get("fullName"),
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
    isVerified: formData.get("isVerified") === "on",
    status: formData.get("status") || undefined,
    facilityIds,
  });
  if (!parsed.success)
    return { ok: false, message: "Please fix the errors below.", fieldErrors: fieldErrorsFromZod(parsed.error) };

  const data = parsed.data;
  const baseSlug = data.bmdcNumber
    ? `${data.fullName}-${data.bmdcNumber}`
    : data.fullName;
  const slug = await uniqueSlug(baseSlug, async (s) => {
    const f = await prisma.doctor.findUnique({ where: { slug: s } });
    return Boolean(f);
  });

  await prisma.doctor.create({
    data: {
      fullName: data.fullName,
      slug,
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
      isVerified: data.isVerified ?? false,
      status: data.status ?? "PUBLISHED",
      createdByAdmin: true,
      doctorFacilities: {
        create: (data.facilityIds ?? []).map((fid) => ({ facilityId: fid })),
      },
    },
  });
  revalidatePath("/admin/doctors");
  revalidatePath("/search");
  redirect("/admin/doctors?saved=1");
}

export async function updateDoctorAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { ok: false, message: "Invalid id." };
  const facilityIds = formData.getAll("facilityIds").map((v) => Number(v)).filter(Boolean);
  const parsed = doctorUpdateSchema.safeParse({
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
    isVerified: formData.get("isVerified") === "on",
    status: formData.get("status") || undefined,
    facilityIds,
  });
  if (!parsed.success)
    return { ok: false, message: "Please fix the errors below.", fieldErrors: fieldErrorsFromZod(parsed.error) };

  const data = parsed.data;
  const existing = await prisma.doctor.findUnique({ where: { id }, include: { doctorFacilities: true } });
  if (!existing) return { ok: false, message: "Doctor not found." };

  await prisma.$transaction(async (tx: any) => {
    await tx.doctor.update({
      where: { id },
      data: {
        fullName: data.fullName ?? existing.fullName,
        gender: data.gender === undefined ? existing.gender : data.gender,
        bmdcNumber: data.bmdcNumber === undefined ? existing.bmdcNumber : data.bmdcNumber || null,
        experienceYears: data.experienceYears === undefined ? existing.experienceYears : data.experienceYears,
        consultationFee: data.consultationFee === undefined ? existing.consultationFee : data.consultationFee,
        about: data.about === undefined ? existing.about : data.about || null,
        phone: data.phone === undefined ? existing.phone : data.phone || null,
        email: data.email === undefined ? existing.email : data.email || null,
        website: data.website === undefined ? existing.website : data.website || null,
        facebook: data.facebook === undefined ? existing.facebook : data.facebook || null,
        linkedin: data.linkedin === undefined ? existing.linkedin : data.linkedin || null,
        hospitalName: data.hospitalName === undefined ? existing.hospitalName : data.hospitalName || null,
        chamberAddress: data.chamberAddress === undefined ? existing.chamberAddress : data.chamberAddress || null,
        city: data.city === undefined ? existing.city : data.city || null,
        area: data.area === undefined ? existing.area : data.area || null,
        specialtyId: data.specialtyId === undefined ? existing.specialtyId : data.specialtyId,
        isVerified: data.isVerified === undefined ? existing.isVerified : data.isVerified,
        status: data.status ?? existing.status,
      },
    });
    if (data.facilityIds) {
      await tx.doctorFacility.deleteMany({ where: { doctorId: id } });
      if (data.facilityIds.length) {
        await tx.doctorFacility.createMany({
          data: data.facilityIds.map((fid) => ({ doctorId: id, facilityId: fid })),
        });
      }
    }
  });

  revalidatePath("/admin/doctors");
  revalidatePath(`/admin/doctors/${id}`);
  revalidatePath("/search");
  revalidatePath(`/doctor/${existing.slug}`);
  redirect(`/admin/doctors/${id}?saved=1`);
}

export async function deleteDoctorAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  const doc = await prisma.doctor.findUnique({ where: { id } });
  await prisma.doctor.deleteMany({ where: { id } });
  revalidatePath("/admin/doctors");
  revalidatePath("/search");
  if (doc) revalidatePath(`/doctor/${doc.slug}`);
}

export async function createBlogAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const session = await requireAdmin();
  const parsed = blogSchema.safeParse({
    title: formData.get("title"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    status: formData.get("status") || undefined,
    doctorId: formData.get("doctorId") || undefined,
  });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  const slug = await uniqueSlug(parsed.data.title, async (s) => {
    const f = await prisma.blog.findUnique({ where: { slug: s } });
    return Boolean(f);
  });
  await prisma.blog.create({
    data: {
      title: parsed.data.title,
      excerpt: parsed.data.excerpt || null,
      content: parsed.data.content,
      status: parsed.data.status ?? "DRAFT",
      authorId: Number(session.user.id),
      doctorId: parsed.data.doctorId ?? null,
      slug,
      publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
    },
  });
  revalidatePath("/admin/blogs");
  redirect("/admin/blogs?saved=1");
}

export async function deleteBlogAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.blog.deleteMany({ where: { id } });
  revalidatePath("/admin/blogs");
}

export async function updateUserAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { ok: false, message: "Invalid id." };
  const parsed = userUpdateSchema.safeParse({
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || undefined,
    isActive: formData.get("isActive") === "on",
    role: formData.get("role") || undefined,
  });
  if (!parsed.success)
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      isActive: parsed.data.isActive,
      role: parsed.data.role,
    },
  });
  revalidatePath("/admin/users");
  redirect("/admin/users?saved=1");
}

export async function deleteUserAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  if (id === Number(session.user.id)) return;
  await prisma.user.deleteMany({ where: { id } });
  revalidatePath("/admin/users");
}

export async function reviewDecisionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const parsed = reviewDecisionSchema.safeParse({
    reviewId: formData.get("reviewId"),
    isApproved: formData.get("isApproved") === "true",
  });
  if (!parsed.success) return;
  await prisma.review.update({
    where: { id: parsed.data.reviewId },
    data: { isApproved: parsed.data.isApproved },
  });
  revalidatePath("/admin/reviews");
}

export async function deleteReviewAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await prisma.review.deleteMany({ where: { id } });
  revalidatePath("/admin/reviews");
}

export async function claimDecisionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const parsed = claimDecisionSchema.safeParse({
    claimId: formData.get("claimId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const claim = await prisma.doctorClaim.findUnique({ where: { id: parsed.data.claimId } });
  if (!claim) return;

  await prisma.doctorClaim.update({
    where: { id: parsed.data.claimId },
    data: { status: parsed.data.status, reviewedAt: new Date() },
  });

  if (parsed.data.status === "APPROVED") {
    await prisma.$transaction([
      prisma.doctor.update({
        where: { id: claim.doctorId },
        data: { profileClaimed: true, userId: claim.userId, isVerified: true },
      }),
      prisma.user.update({
        where: { id: claim.userId },
        data: { role: UserRole.DOCTOR },
      }),
    ]);
  } else if (parsed.data.status === "REJECTED") {
    await prisma.user.update({
      where: { id: claim.userId },
      data: { role: UserRole.PATIENT },
    });
  }

  void session;
  revalidatePath("/admin/claims");
  revalidatePath("/admin/doctors");
}
