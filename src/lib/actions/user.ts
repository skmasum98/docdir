"use server";

import { revalidatePath } from "next/cache";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { uploadImageToHosting } from "../upload";
import { UserRole } from "../enums";
import type { FormState } from "../form";

export async function updateProfileImageAction(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in to update your profile image." };
  }

  const userId = Number(session.user.id);
  const imageFile = formData.get("image") as File | null;
  const directUrl = formData.get("imageUrl") as string | null;

  let finalUrl: string | null = null;

  if (imageFile && imageFile.size > 0 && typeof imageFile !== "string") {
    try {
      const upload = await uploadImageToHosting(
        imageFile,
        `user-${userId}-${Date.now()}`
      );
      finalUrl = upload.url;
    } catch (e: any) {
      return { ok: false, message: e.message || "Failed to upload image." };
    }
  } else if (directUrl && directUrl.trim()) {
    finalUrl = directUrl.trim();
  } else {
    return { ok: false, message: "No image file or URL provided." };
  }

  // Update in Database
  await prisma.user.update({
    where: { id: userId },
    data: { image: finalUrl },
  });

  // If user is doctor, keep Doctor.profilePhoto synchronized
  const doctor = await prisma.doctor.findFirst({ where: { userId } });
  if (doctor) {
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { profilePhoto: finalUrl },
    });
    revalidatePath(`/doctor/${doctor.slug}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/");

  return {
    ok: true,
    message: "Profile image updated successfully.",
    data: { imageUrl: finalUrl },
  };
}

export async function removeProfileImageAction(): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in." };
  }

  const userId = Number(session.user.id);

  await prisma.user.update({
    where: { id: userId },
    data: { image: null },
  });

  const doctor = await prisma.doctor.findFirst({ where: { userId } });
  if (doctor) {
    await prisma.doctor.update({
      where: { id: doctor.id },
      data: { profilePhoto: null },
    });
    revalidatePath(`/doctor/${doctor.slug}`);
  }

  revalidatePath("/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/");

  return { ok: true, message: "Profile image removed successfully." };
}

export async function updateAccountDetailsAction(
  _prev: FormState | undefined,
  formData: FormData
): Promise<FormState> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "You must be signed in." };
  }

  const userId = Number(session.user.id);
  const name = formData.get("name") as string;
  const phone = (formData.get("phone") as string) || null;

  if (!name || name.trim().length < 2) {
    return {
      ok: false,
      message: "Please enter a valid name.",
      fieldErrors: { name: "Name is too short" },
    };
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      name: name.trim(),
      phone: phone?.trim() || null,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/admin/users");
  revalidatePath("/");

  return { ok: true, message: "Account details updated successfully." };
}
