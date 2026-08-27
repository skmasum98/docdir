"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "../prisma";
import { requireSession } from "../auth-helpers";
import {
  facilityClaimCreateSchema,
  facilitySelfUpdateSchema,
  facilityTestSchema,
  facilityTestUpdateSchema,
} from "../validation";
import { UserRole } from "../enums";
import type { FormState } from "../form";

function fieldErrorsFromZod(err: import("zod").ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const k = issue.path[0];
    if (typeof k === "string") fieldErrors[k] = issue.message;
  }
  return fieldErrors;
}

/**
 * Submit a request to claim management of a Hospital / Clinic / Diagnostic Center
 */
export async function submitFacilityClaimAction(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await requireSession();
  const userId = Number(session.user.id);

  const parsed = facilityClaimCreateSchema.safeParse({
    facilityId: formData.get("facilityId"),
    officialPhone: formData.get("officialPhone"),
    officialEmail: formData.get("officialEmail") || undefined,
    designation: formData.get("designation"),
    tradeLicenseNumber: formData.get("tradeLicenseNumber") || undefined,
    tradeLicenseImage: formData.get("tradeLicenseImage") || undefined,
    authorizationLetter: formData.get("authorizationLetter") || undefined,
    note: formData.get("note") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please check the required fields.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  const facility = await prisma.facility.findUnique({
    where: { id: parsed.data.facilityId },
  });

  if (!facility) {
    return { ok: false, message: "Facility not found." };
  }

  if (facility.profileClaimed && facility.userId) {
    return {
      ok: false,
      message: "This facility profile has already been verified and claimed.",
    };
  }

  // Check if user already submitted a pending claim for this facility
  const existingPending = await prisma.facilityClaim.findFirst({
    where: {
      facilityId: parsed.data.facilityId,
      userId,
      status: "PENDING",
    },
  });

  if (existingPending) {
    return {
      ok: false,
      message: "You already have a pending claim for this facility under review.",
    };
  }

  await prisma.facilityClaim.create({
    data: {
      facilityId: parsed.data.facilityId,
      userId,
      officialPhone: parsed.data.officialPhone,
      officialEmail: parsed.data.officialEmail || null,
      designation: parsed.data.designation,
      tradeLicenseNumber: parsed.data.tradeLicenseNumber || null,
      tradeLicenseImage: parsed.data.tradeLicenseImage || null,
      authorizationLetter: parsed.data.authorizationLetter || null,
      note: parsed.data.note || null,
    },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/admin/claims");
  redirect(`/dashboard/claim-facility?success=1&facilityId=${facility.id}`);
}

/**
 * Update Facility Profile by verified Facility Admin or Super Admin
 */
export async function updateFacilityProfileSelfAction(
  facilityId: number,
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  // Verify ownership or Admin role
  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility) {
    return { ok: false, message: "Facility not found." };
  }

  if (userRole !== UserRole.ADMIN && facility.userId !== userId) {
    return { ok: false, message: "You do not have permission to manage this facility." };
  }

  const parsed = facilitySelfUpdateSchema.safeParse({
    name: formData.get("name") || undefined,
    phone: formData.get("phone") || undefined,
    hotline: formData.get("hotline") || undefined,
    email: formData.get("email") || undefined,
    website: formData.get("website") || undefined,
    emergencyContact: formData.get("emergencyContact") || undefined,
    address: formData.get("address") || undefined,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  await prisma.facility.update({
    where: { id: facilityId },
    data: {
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      phone: parsed.data.phone || null,
      hotline: parsed.data.hotline || null,
      email: parsed.data.email || null,
      website: parsed.data.website || null,
      emergencyContact: parsed.data.emergencyContact || null,
      address: parsed.data.address || null,
    },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
  return { ok: true, message: "Facility details updated successfully!" };
}

/**
 * Facility Admin adds a diagnostic test
 */
export async function facilityAddTestAction(
  facilityId: number,
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return { ok: false, message: "Unauthorized." };
  }

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
    homeSampleAvailable: formData.get("homeSampleAvailable") === "on" || formData.get("homeSampleAvailable") === "true",
    description: formData.get("description") || undefined,
    isActive: true,
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fill required test details.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  await prisma.facilityTest.create({
    data: {
      facilityId,
      code: parsed.data.code,
      name: parsed.data.name,
      category: parsed.data.category,
      price: parsed.data.price,
      discountPrice: parsed.data.discountPrice !== undefined && parsed.data.discountPrice !== "" ? Number(parsed.data.discountPrice) : null,
      sampleType: parsed.data.sampleType || null,
      deliveryTime: parsed.data.deliveryTime || null,
      preparation: parsed.data.preparation || null,
      homeSampleAvailable: parsed.data.homeSampleAvailable ?? false,
      description: parsed.data.description || null,
      isActive: true,
    },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
  return { ok: true, message: "Diagnostic test added to catalog!" };
}

/**
 * Facility Admin updates a diagnostic test
 */
export async function facilityUpdateTestAction(
  testId: number,
  facilityId: number,
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return { ok: false, message: "Unauthorized." };
  }

  const parsed = facilityTestUpdateSchema.safeParse({
    code: formData.get("code") || undefined,
    name: formData.get("name") || undefined,
    category: formData.get("category") || undefined,
    price: formData.get("price") || undefined,
    discountPrice: formData.get("discountPrice") || undefined,
    sampleType: formData.get("sampleType") || undefined,
    deliveryTime: formData.get("deliveryTime") || undefined,
    preparation: formData.get("preparation") || undefined,
    homeSampleAvailable: formData.get("homeSampleAvailable") === "on" || formData.get("homeSampleAvailable") === "true",
    description: formData.get("description") || undefined,
    isActive: formData.get("isActive") !== "false",
  });

  if (!parsed.success) {
    return {
      ok: false,
      message: "Invalid input.",
      fieldErrors: fieldErrorsFromZod(parsed.error),
    };
  }

  await prisma.facilityTest.update({
    where: { id: testId },
    data: {
      ...(parsed.data.code ? { code: parsed.data.code } : {}),
      ...(parsed.data.name ? { name: parsed.data.name } : {}),
      ...(parsed.data.category ? { category: parsed.data.category } : {}),
      ...(parsed.data.price !== undefined ? { price: Number(parsed.data.price) } : {}),
      discountPrice: parsed.data.discountPrice !== undefined && parsed.data.discountPrice !== "" ? Number(parsed.data.discountPrice) : null,
      sampleType: parsed.data.sampleType || null,
      deliveryTime: parsed.data.deliveryTime || null,
      preparation: parsed.data.preparation || null,
      homeSampleAvailable: parsed.data.homeSampleAvailable ?? false,
      description: parsed.data.description || null,
      isActive: parsed.data.isActive ?? true,
    },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
  return { ok: true, message: "Test updated successfully!" };
}

/**
 * Facility Admin deletes a test
 */
export async function facilityDeleteTestAction(testId: number, facilityId: number): Promise<void> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return;
  }

  await prisma.facilityTest.deleteMany({
    where: { id: testId, facilityId },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
}

/**
 * Link Doctor to Facility
 */
export async function facilityLinkDoctorAction(facilityId: number, doctorId: number): Promise<void> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return;
  }

  await prisma.doctorFacility.upsert({
    where: {
      doctorId_facilityId: {
        doctorId,
        facilityId,
      },
    },
    update: {},
    create: {
      doctorId,
      facilityId,
    },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
}

/**
 * Unlink Doctor from Facility
 */
export async function facilityUnlinkDoctorAction(facilityId: number, doctorId: number): Promise<void> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return;
  }

  await prisma.doctorFacility.deleteMany({
    where: {
      doctorId,
      facilityId,
    },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
}

/**
 * Bulk Add items from master catalog with custom prices for Facility Admin or Super Admin
 */
export async function facilityAddFromCatalogAction(
  facilityId: number,
  items: Array<{
    code: string;
    name: string;
    category: string;
    price: number;
    discountPrice?: number | null;
    sampleType?: string | null;
    deliveryTime?: string | null;
    preparation?: string | null;
    homeSampleAvailable?: boolean;
    description?: string | null;
    isActive?: boolean;
  }>
): Promise<{ ok: boolean; message: string; count?: number }> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return { ok: false, message: "Unauthorized to manage this facility." };
  }

  if (!items || items.length === 0) {
    return { ok: false, message: "No catalog items selected." };
  }

  const existingCodes = new Set(
    (
      await prisma.facilityTest.findMany({
        where: { facilityId },
        select: { code: true },
      })
    ).map((t) => t.code)
  );

  let addedCount = 0;
  for (const item of items) {
    if (existingCodes.has(item.code)) {
      // Update existing item's price and active status
      await prisma.facilityTest.updateMany({
        where: { facilityId, code: item.code },
        data: {
          price: Math.max(0, Number(item.price) || 0),
          discountPrice: item.discountPrice !== undefined && item.discountPrice !== null ? Number(item.discountPrice) : null,
          isActive: item.isActive ?? true,
        },
      });
      addedCount++;
    } else {
      // Create new
      await prisma.facilityTest.create({
        data: {
          facilityId,
          code: item.code,
          name: item.name,
          category: item.category,
          price: Math.max(0, Number(item.price) || 0),
          discountPrice: item.discountPrice !== undefined && item.discountPrice !== null ? Number(item.discountPrice) : null,
          sampleType: item.sampleType || null,
          deliveryTime: item.deliveryTime || null,
          preparation: item.preparation || null,
          homeSampleAvailable: item.homeSampleAvailable ?? false,
          description: item.description || null,
          isActive: item.isActive ?? true,
        },
      });
      addedCount++;
    }
  }

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
  revalidatePath(`/admin/facilities/${facilityId}/tests`);
  revalidatePath("/admin/facilities");

  return {
    ok: true,
    message: `Successfully configured ${addedCount} services/tests for ${facility.name}!`,
    count: addedCount,
  };
}

/**
 * Toggle Active / Inactive Status for a test or service
 */
export async function facilityToggleTestStatusAction(
  testId: number,
  facilityId: number,
  isActive: boolean
): Promise<{ ok: boolean }> {
  const session = await requireSession();
  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
  });

  if (!facility || (userRole !== UserRole.ADMIN && facility.userId !== userId)) {
    return { ok: false };
  }

  await prisma.facilityTest.updateMany({
    where: { id: testId, facilityId },
    data: { isActive },
  });

  revalidatePath(`/facility/${facility.slug}`);
  revalidatePath("/dashboard/facility");
  revalidatePath(`/admin/facilities/${facilityId}/tests`);
  revalidatePath("/admin/facilities");

  return { ok: true };
}
