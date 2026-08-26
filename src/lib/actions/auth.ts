"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "../prisma";
import { registerSchema } from "../validation";
import { UserRole } from "../enums";
import { uploadImageToHosting } from "../upload";
import type { FormState } from "../form";

export async function registerAction(
  _prev: FormState | undefined,
  formData: FormData,
): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    phone: formData.get("phone") || undefined,
    role: formData.get("role"),
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
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return {
      ok: false,
      message: "An account with this email already exists.",
      fieldErrors: { email: "Email already in use" },
    };
  }

  const imageFile = formData.get("image") as File | null;
  let imageUrl: string | null = null;
  if (imageFile && imageFile.size > 0 && typeof imageFile !== "string") {
    try {
      const upload = await uploadImageToHosting(imageFile, `user-reg-${Date.now()}`);
      imageUrl = upload.url;
    } catch (err) {
      console.warn("Registration image upload warning:", err);
    }
  }

  const hashed = await bcrypt.hash(data.password, 10);
  const normalizedEmail = data.email.trim().toLowerCase();
  const user = await prisma.user.create({
    data: {
      name: data.name.trim(),
      email: normalizedEmail,
      password: hashed,
      phone: data.phone || null,
      image: imageUrl,
      role: data.role,
      isActive: true,
    },
  });

  if (user.role === UserRole.DOCTOR) {
    const baseSlug = user.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "doctor";
    const doctorSlug = `${baseSlug}-${user.id}`;
    await prisma.doctor.create({
      data: {
        fullName: user.name,
        slug: doctorSlug,
        userId: user.id,
        phone: user.phone,
        profilePhoto: imageUrl,
        createdByAdmin: false,
        status: "DRAFT",
      },
    });
  }

  revalidatePath("/admin/users");
  redirect("/login?registered=1");
}
