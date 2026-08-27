"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { requireAdmin } from "../auth-helpers";
import {
  specialtySchema,
  facilitySchema,
  facilityUpdateSchema,
  doctorCreateSchema,
  doctorUpdateSchema,
  divisionSchema,
  districtSchema,
  upazilaSchema,
  blogSchema,
  userUpdateSchema,
  reviewDecisionSchema,
  claimDecisionSchema,
  facilityClaimDecisionSchema,
  facilityTestSchema,
  facilityTestUpdateSchema,
} from "../validation";
import { DEFAULT_DIAGNOSTIC_TESTS } from "../diagnostic-tests-data";
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
    logo: formData.get("logo") || undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    hotline: formData.get("hotline") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
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
      logo: parsed.data.logo || null,
      address: parsed.data.address || null,
      phone: parsed.data.phone || null,
      hotline: parsed.data.hotline || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      emergencyContact: parsed.data.emergencyContact || null,
      upazilaId: parsed.data.upazilaId,
      slug,
    },
  });
  revalidatePath("/admin/facilities");
  revalidatePath("/facilities");
  revalidatePath("/search");
  redirect("/admin/facilities?saved=1");
}

export async function updateFacilityAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { ok: false, message: "Invalid facility ID." };

  const parsed = facilityUpdateSchema.safeParse({
    name: formData.get("name") || undefined,
    type: formData.get("type") || undefined,
    logo: formData.get("logo") !== null ? (formData.get("logo") as string) : undefined,
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    hotline: formData.get("hotline") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
    upazilaId: formData.get("upazilaId") ? Number(formData.get("upazilaId")) : undefined,
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.facility.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Facility not found." };

  const removeLogo = formData.get("removeLogo") === "true";

  await prisma.facility.update({
    where: { id },
    data: {
      name: parsed.data.name ?? existing.name,
      type: parsed.data.type ?? existing.type,
      logo: removeLogo ? null : parsed.data.logo !== undefined ? (parsed.data.logo || null) : existing.logo,
      address: parsed.data.address === undefined ? existing.address : parsed.data.address || null,
      phone: parsed.data.phone === undefined ? existing.phone : parsed.data.phone || null,
      hotline: parsed.data.hotline === undefined ? existing.hotline : parsed.data.hotline || null,
      email: parsed.data.email === undefined ? existing.email : parsed.data.email || null,
      website: parsed.data.website === undefined ? existing.website : parsed.data.website || null,
      emergencyContact: parsed.data.emergencyContact === undefined ? existing.emergencyContact : parsed.data.emergencyContact || null,
      upazilaId: parsed.data.upazilaId ?? existing.upazilaId,
    },
  });

  revalidatePath("/admin/facilities");
  revalidatePath(`/facility/${existing.slug}`);
  revalidatePath("/facilities");
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
  const photoFromForm = formData.get("profilePhoto") as string | null;
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
      profilePhoto: photoFromForm ? photoFromForm.trim() || null : null,
      degrees: data.degrees || null,
      designation: data.designation || null,
      gender: data.gender ?? null,
      bmdcNumber: data.bmdcNumber || null,
      experienceYears: data.experienceYears ?? null,
      consultationFee: data.consultationFee ?? null,
      followUpFee: data.followUpFee ?? null,
      visitingHours: data.visitingHours || null,
      services: data.services || null,
      about: data.about || null,
      phone: data.phone || null,
      appointmentPhone: data.appointmentPhone || null,
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
  const photoFromForm = formData.get("profilePhoto") as string | null;
  const parsed = doctorUpdateSchema.safeParse({
    fullName: formData.get("fullName") || undefined,
    degrees: formData.get("degrees") || undefined,
    designation: formData.get("designation") || undefined,
    gender: formData.get("gender") || undefined,
    bmdcNumber: formData.get("bmdcNumber") || undefined,
    experienceYears: formData.get("experienceYears") || undefined,
    consultationFee: formData.get("consultationFee") || undefined,
    followUpFee: formData.get("followUpFee") || undefined,
    visitingHours: formData.get("visitingHours") || undefined,
    services: formData.get("services") || undefined,
    about: formData.get("about") || undefined,
    phone: formData.get("phone") || undefined,
    appointmentPhone: formData.get("appointmentPhone") || undefined,
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
        profilePhoto: photoFromForm !== null ? (photoFromForm.trim() || null) : existing.profilePhoto,
        degrees: data.degrees === undefined ? existing.degrees : data.degrees || null,
        designation: data.designation === undefined ? existing.designation : data.designation || null,
        gender: data.gender === undefined ? existing.gender : data.gender,
        bmdcNumber: data.bmdcNumber === undefined ? existing.bmdcNumber : data.bmdcNumber || null,
        experienceYears: data.experienceYears === undefined ? existing.experienceYears : data.experienceYears,
        consultationFee: data.consultationFee === undefined ? existing.consultationFee : data.consultationFee,
        followUpFee: data.followUpFee === undefined ? existing.followUpFee : data.followUpFee,
        visitingHours: data.visitingHours === undefined ? existing.visitingHours : data.visitingHours || null,
        services: data.services === undefined ? existing.services : data.services || null,
        about: data.about === undefined ? existing.about : data.about || null,
        phone: data.phone === undefined ? existing.phone : data.phone || null,
        appointmentPhone: data.appointmentPhone === undefined ? existing.appointmentPhone : data.appointmentPhone || null,
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
    if (photoFromForm !== null && existing.userId) {
      await tx.user.update({
        where: { id: existing.userId },
        data: { image: photoFromForm.trim() || null },
      });
    }
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
  const imageFromForm = formData.get("image") as string | null;

  await prisma.user.update({
    where: { id },
    data: {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      isActive: parsed.data.isActive,
      role: parsed.data.role,
      ...(imageFromForm !== null ? { image: imageFromForm.trim() || null } : {}),
    },
  });

  if (imageFromForm !== null) {
    const doc = await prisma.doctor.findFirst({ where: { userId: id } });
    if (doc) {
      await prisma.doctor.update({
        where: { id: doc.id },
        data: { profilePhoto: imageFromForm.trim() || null },
      });
    }
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
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

export async function facilityClaimDecisionAction(formData: FormData): Promise<void> {
  const session = await requireAdmin();
  const parsed = facilityClaimDecisionSchema.safeParse({
    claimId: formData.get("claimId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const claim = await prisma.facilityClaim.findUnique({
    where: { id: parsed.data.claimId },
    include: { user: true, facility: true },
  });
  if (!claim) return;

  await prisma.facilityClaim.update({
    where: { id: parsed.data.claimId },
    data: { status: parsed.data.status, reviewedAt: new Date() },
  });

  if (parsed.data.status === "APPROVED") {
    // Check if user is ADMIN; if not, promote to FACILITY_ADMIN
    const newRole = claim.user.role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.FACILITY_ADMIN;

    await prisma.$transaction([
      prisma.facility.update({
        where: { id: claim.facilityId },
        data: {
          profileClaimed: true,
          userId: claim.userId,
          isVerified: true,
          phone: claim.facility.phone || claim.officialPhone,
          hotline: claim.facility.hotline || claim.officialPhone,
          email: claim.facility.email || claim.officialEmail,
        },
      }),
      prisma.user.update({
        where: { id: claim.userId },
        data: { role: newRole },
      }),
    ]);
  } else if (parsed.data.status === "REJECTED") {
    // If no other facilities owned, and role was FACILITY_ADMIN, revert to PATIENT
    const otherClaims = await prisma.facility.count({
      where: { userId: claim.userId, id: { not: claim.facilityId } },
    });
    if (otherClaims === 0 && claim.user.role === UserRole.FACILITY_ADMIN) {
      await prisma.user.update({
        where: { id: claim.userId },
        data: { role: UserRole.PATIENT },
      });
    }
  }

  void session;
  revalidatePath("/admin/claims");
  revalidatePath("/facilities");
  revalidatePath(`/facility/${claim.facility.slug}`);
}

export async function createFacilityTestAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const facilityId = Number(formData.get("facilityId"));
  const parsed = facilityTestSchema.safeParse({
    facilityId,
    code: formData.get("code"),
    name: formData.get("name"),
    category: formData.get("category"),
    price: formData.get("price"),
    discountPrice: formData.get("discountPrice") || undefined,
    sampleType: formData.get("sampleType") || undefined,
    deliveryTime: formData.get("deliveryTime") || undefined,
    preparation: formData.get("preparation") || undefined,
    homeSampleAvailable: formData.get("homeSampleAvailable") === "on",
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== "off",
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid input. Check required fields.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
  if (!facility) return { ok: false, message: "Facility not found." };

  await prisma.facilityTest.create({
    data: {
      facilityId: parsed.data.facilityId,
      code: parsed.data.code.toUpperCase().trim(),
      name: parsed.data.name.trim(),
      category: parsed.data.category.trim(),
      price: parsed.data.price,
      discountPrice: parsed.data.discountPrice !== undefined && parsed.data.discountPrice !== "" ? Number(parsed.data.discountPrice) : null,
      sampleType: parsed.data.sampleType?.trim() || null,
      deliveryTime: parsed.data.deliveryTime?.trim() || null,
      preparation: parsed.data.preparation?.trim() || null,
      homeSampleAvailable: parsed.data.homeSampleAvailable ?? false,
      description: parsed.data.description?.trim() || null,
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath(`/admin/facilities/${facilityId}/tests`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/facilities");
  return { ok: true, message: `Added "${parsed.data.name}" to catalog.` };
}

export async function updateFacilityTestAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return { ok: false, message: "Invalid test ID." };

  const parsed = facilityTestUpdateSchema.safeParse({
    code: formData.get("code") || undefined,
    name: formData.get("name") || undefined,
    category: formData.get("category") || undefined,
    price: formData.get("price") !== null ? Number(formData.get("price")) : undefined,
    discountPrice: formData.get("discountPrice") !== null && formData.get("discountPrice") !== "" ? Number(formData.get("discountPrice")) : null,
    sampleType: formData.get("sampleType") || undefined,
    deliveryTime: formData.get("deliveryTime") || undefined,
    preparation: formData.get("preparation") || undefined,
    homeSampleAvailable: formData.get("homeSampleAvailable") === "on",
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") === "on",
  });

  if (!parsed.success) {
    return { ok: false, message: "Invalid input.", fieldErrors: fieldErrorsFromZod(parsed.error) };
  }

  const existing = await prisma.facilityTest.findUnique({
    where: { id },
    include: { facility: { select: { id: true, slug: true } } },
  });
  if (!existing) return { ok: false, message: "Test not found." };

  await prisma.facilityTest.update({
    where: { id },
    data: {
      code: parsed.data.code ? parsed.data.code.toUpperCase().trim() : existing.code,
      name: parsed.data.name ? parsed.data.name.trim() : existing.name,
      category: parsed.data.category ? parsed.data.category.trim() : existing.category,
      price: parsed.data.price !== undefined ? parsed.data.price : existing.price,
      discountPrice:
        typeof parsed.data.discountPrice === "number"
          ? parsed.data.discountPrice
          : parsed.data.discountPrice === null || parsed.data.discountPrice === ""
          ? null
          : existing.discountPrice,
      sampleType: parsed.data.sampleType !== undefined ? parsed.data.sampleType.trim() || null : existing.sampleType,
      deliveryTime: parsed.data.deliveryTime !== undefined ? parsed.data.deliveryTime.trim() || null : existing.deliveryTime,
      preparation: parsed.data.preparation !== undefined ? parsed.data.preparation.trim() || null : existing.preparation,
      homeSampleAvailable: parsed.data.homeSampleAvailable !== undefined ? parsed.data.homeSampleAvailable : existing.homeSampleAvailable,
      description: parsed.data.description !== undefined ? parsed.data.description.trim() || null : existing.description,
      isActive: parsed.data.isActive !== undefined ? parsed.data.isActive : existing.isActive,
    },
  });

  revalidatePath(`/admin/facilities/${existing.facilityId}/tests`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/facility/${existing.facility.slug}`);
  revalidatePath("/facilities");
  return { ok: true, message: `Updated "${existing.name}" successfully.` };
}

export async function deleteFacilityTestAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;

  const test = await prisma.facilityTest.findUnique({
    where: { id },
    include: { facility: { select: { id: true, slug: true } } },
  });
  if (!test) return;

  await prisma.facilityTest.delete({ where: { id } });

  revalidatePath(`/admin/facilities/${test.facilityId}/tests`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/facility/${test.facility.slug}`);
  revalidatePath("/facilities");
}

export async function seedFacilityTestsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const facilityId = Number(formData.get("facilityId"));
  const overwrite = formData.get("overwrite") === "true";
  if (!Number.isFinite(facilityId)) return;

  const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
  if (!facility) return;

  if (overwrite) {
    await prisma.facilityTest.deleteMany({ where: { facilityId } });
  }

  // Insert standard diagnostic test catalog
  const currentCodes = new Set(
    (await prisma.facilityTest.findMany({ where: { facilityId }, select: { code: true } })).map((t) => t.code)
  );

  for (const t of DEFAULT_DIAGNOSTIC_TESTS) {
    if (!currentCodes.has(t.code)) {
      await prisma.facilityTest.create({
        data: {
          facilityId,
          code: t.code,
          name: t.name,
          category: t.category,
          price: t.defaultPrice,
          discountPrice: t.defaultDiscountPrice || null,
          sampleType: t.sampleType || null,
          deliveryTime: t.deliveryTime || null,
          preparation: t.preparation || null,
          homeSampleAvailable: t.homeSampleAvailable ?? false,
          description: t.description || null,
          isActive: true,
        },
      });
    }
  }

  revalidatePath(`/admin/facilities/${facilityId}/tests`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/facilities");
}

export async function bulkDiscountFacilityTestsAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const facilityId = Number(formData.get("facilityId"));
  const percentage = Number(formData.get("percentage")); // e.g. 10 for 10% discount
  if (!Number.isFinite(facilityId) || !Number.isFinite(percentage) || percentage < 0 || percentage > 90) return;

  const facility = await prisma.facility.findUnique({ where: { id: facilityId } });
  if (!facility) return;

  const tests = await prisma.facilityTest.findMany({ where: { facilityId } });

  for (const t of tests) {
    if (percentage === 0) {
      // Remove discounts
      await prisma.facilityTest.update({
        where: { id: t.id },
        data: { discountPrice: null },
      });
    } else {
      const discount = Math.round(t.price * (1 - percentage / 100));
      await prisma.facilityTest.update({
        where: { id: t.id },
        data: { discountPrice: discount },
      });
    }
  }

  revalidatePath(`/admin/facilities/${facilityId}/tests`);
  revalidatePath("/admin/facilities");
  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/facilities");
}

