"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { auth } from "../auth";
import bcrypt from "bcryptjs";
import { UserRole } from "../enums";

const DEFAULT_TEMP_PASSWORD_LENGTH = 12;

function generateTempPassword(): string {
  // Generate a memorable but secure password
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < DEFAULT_TEMP_PASSWORD_LENGTH; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function getDoctorIdFromUser(userId: number): Promise<number | null> {
  const doctor = await prisma.doctor.findFirst({ where: { userId } });
  return doctor?.id || null;
}

export async function createReceptionistAction(input: {
  name: string;
  email: string;
  phone: string;
  password?: string;
  canCancel?: boolean;
  canBookOffline?: boolean;
  canMarkNoShow?: boolean;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };
  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
    return { ok: false, message: "Only doctors can create receptionists" };
  }

  const doctorId = await getDoctorIdFromUser(Number(session.user.id));
  if (!doctorId) {
    return { ok: false, message: "No doctor profile linked to your account" };
  }

  // Validate email not already in use
  const existing = await prisma.user.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });
  if (existing) {
    return { ok: false, message: "Email is already registered" };
  }

  // Generate or use provided password
  const password = input.password || generateTempPassword();
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Create user and receptionist in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: input.name.trim(),
          email: input.email.toLowerCase().trim(),
          password: hashedPassword,
          phone: input.phone.trim(),
          role: UserRole.PATIENT, // Receptionists are patients with extra permissions
          isActive: true,
        },
      });

      const receptionist = await tx.receptionist.create({
        data: {
          doctorId,
          userId: user.id,
          name: input.name.trim(),
          phone: input.phone.trim(),
          canCancel: input.canCancel ?? true,
          canBookOffline: input.canBookOffline ?? true,
          canMarkNoShow: input.canMarkNoShow ?? true,
        },
      });

      return { user, receptionist };
    });

    revalidatePath("/dashboard/receptionists");
    return {
      ok: true,
      message: `Receptionist "${input.name}" created successfully`,
      data: {
        receptionistId: result.receptionist.id,
        email: result.user.email,
        tempPassword: input.password ? null : password, // Only return if auto-generated
      },
    };
  } catch (error: any) {
    console.error("Create receptionist error:", error);
    return { ok: false, message: "Failed to create receptionist" };
  }
}

export async function listReceptionistsAction() {
  const session = await auth();
  if (!session?.user) return [];

  const doctorId = await getDoctorIdFromUser(Number(session.user.id));
  if (!doctorId) return [];

  return prisma.receptionist.findMany({
    where: { doctorId },
    include: {
      user: { select: { id: true, name: true, email: true, isActive: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateReceptionistAction(
  receptionistId: number,
  input: {
    name?: string;
    phone?: string;
    canCancel?: boolean;
    canBookOffline?: boolean;
    canMarkNoShow?: boolean;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const doctorId = await getDoctorIdFromUser(Number(session.user.id));
  if (!doctorId) return { ok: false, message: "No doctor profile" };

  const existing = await prisma.receptionist.findUnique({
    where: { id: receptionistId },
  });
  if (!existing || existing.doctorId !== doctorId) {
    return { ok: false, message: "Receptionist not found" };
  }

  await prisma.receptionist.update({
    where: { id: receptionistId },
    data: {
      name: input.name?.trim(),
      phone: input.phone?.trim(),
      canCancel: input.canCancel,
      canBookOffline: input.canBookOffline,
      canMarkNoShow: input.canMarkNoShow,
      isActive: input.isActive,
    },
  });

  if (input.isActive === false) {
    // Deactivate the user too
    await prisma.user.update({
      where: { id: existing.userId },
      data: { isActive: false },
    });
  } else if (input.isActive === true) {
    await prisma.user.update({
      where: { id: existing.userId },
      data: { isActive: true },
    });
  }

  revalidatePath("/dashboard/receptionists");
  return { ok: true, message: "Receptionist updated" };
}

export async function deleteReceptionistAction(receptionistId: number) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const doctorId = await getDoctorIdFromUser(Number(session.user.id));
  if (!doctorId) return { ok: false, message: "No doctor profile" };

  const existing = await prisma.receptionist.findUnique({
    where: { id: receptionistId },
  });
  if (!existing || existing.doctorId !== doctorId) {
    return { ok: false, message: "Receptionist not found" };
  }

  // Soft delete - just deactivate, don't actually delete to preserve history
  await prisma.$transaction([
    prisma.receptionist.update({
      where: { id: receptionistId },
      data: { isActive: false },
    }),
    prisma.user.update({
      where: { id: existing.userId },
      data: { isActive: false },
    }),
  ]);

  revalidatePath("/dashboard/receptionists");
  return { ok: true, message: "Receptionist deactivated" };
}

export async function resetReceptionistPasswordAction(receptionistId: number) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const doctorId = await getDoctorIdFromUser(Number(session.user.id));
  if (!doctorId) return { ok: false, message: "No doctor profile" };

  const receptionist = await prisma.receptionist.findUnique({
    where: { id: receptionistId },
  });
  if (!receptionist || receptionist.doctorId !== doctorId) {
    return { ok: false, message: "Receptionist not found" };
  }

  const newPassword = generateTempPassword();
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  await prisma.user.update({
    where: { id: receptionist.userId },
    data: { password: hashedPassword },
  });

  return {
    ok: true,
    message: "Password reset successfully",
    data: { tempPassword: newPassword },
  };
}
