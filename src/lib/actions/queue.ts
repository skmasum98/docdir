"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "../prisma";
import { auth } from "../auth";
import {
  createSlotsForDate,
  updateScheduleBlock,
  deleteScheduleBlock,
  cancelScheduleBlock,
  getDoctorScheduleBlocks,
  getScheduleBlocksInRange,
  getAvailableSlots,
  getNextAvailableDates,
} from "../schedule-generator";
import { getDhakaDateString } from "../timezone";
import {
  calculateQueueEstimates,
  cancelAppointment,
  markNoShow,
  startNextAppointment,
} from "../queue-manager";
import { sendBookingConfirmationEmail, sendCancellationEmail, sendQueueAdvanceEmail } from "../email";
import { sendBookingSms, sendQueueAdvanceSms, sendCancellationSms } from "../sms";
import { decrementSmsCredit, isSmsEnabled } from "../sms-balance";

// =====================================================================
// Schedule Block Management (manual slot creation per date)
// =====================================================================

interface CreateSlotBlockInput {
  date: string; // YYYY-MM-DD
  startTime: string; // "17:00"
  endTime: string; // "21:00"
  slotDuration: number;
  maxPatients: number;
  facilityId?: number | null;
  notes?: string;
}

export async function createSlotBlockAction(input: CreateSlotBlockInput) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) return { ok: false, message: "No doctor profile linked" };
    doctorId = doctor.id;
  } else {
    // Receptionist
    const receptionist = await prisma.receptionist.findUnique({
      where: { userId },
    });
    if (!receptionist) return { ok: false, message: "Receptionist account not found" };
    if (!receptionist.isActive) return { ok: false, message: "Your account is inactive" };
    doctorId = receptionist.doctorId;
  }

  const result = await createSlotsForDate({
    doctorId,
    facilityId: input.facilityId || null,
    date: input.date,
    startTime: input.startTime,
    endTime: input.endTime,
    slotDuration: input.slotDuration,
    maxPatients: input.maxPatients,
    notes: input.notes || undefined,
    createdById: userId,
  });

  if (result.error) {
    return { ok: false, message: result.error };
  }

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/queue");
  return {
    ok: true,
    message: `Created ${result.created} slot(s) for ${input.date}`,
    data: { scheduleBlockId: result.scheduleBlockId, slotsCreated: result.created },
  };
}

export async function updateScheduleBlockAction(
  scheduleId: number,
  input: {
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
    maxPatients?: number;
    notes?: string | null;
    isActive?: boolean;
  }
) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  // Verify authorization
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { ok: false, message: "Schedule not found" };

  let authorized = false;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (doctor && doctor.id === schedule.doctorId) authorized = true;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (receptionist && receptionist.doctorId === schedule.doctorId) authorized = true;
  }
  if (!authorized) return { ok: false, message: "Not authorized" };

  const result = await updateScheduleBlock(scheduleId, input);
  if (!result.success) return { ok: false, message: result.error };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/queue");
  return { ok: true, message: "Schedule updated" };
}

export async function deleteScheduleBlockAction(scheduleId: number) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { ok: false, message: "Schedule not found" };

  let authorized = false;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (doctor && doctor.id === schedule.doctorId) authorized = true;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (receptionist && receptionist.doctorId === schedule.doctorId) authorized = true;
  }
  if (!authorized) return { ok: false, message: "Not authorized" };

  const result = await deleteScheduleBlock(scheduleId);
  if (!result.success) return { ok: false, message: result.error };

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/queue");
  return {
    ok: true,
    message: result.cancelledAppointments > 0
      ? `Schedule deleted. ${result.cancelledAppointments} appointment(s) cancelled and patients notified.`
      : "Schedule deleted",
  };
}

export async function cancelScheduleBlockAction(scheduleId: number, reason: string) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { ok: false, message: "Schedule not found" };

  let authorized = false;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (doctor && doctor.id === schedule.doctorId) authorized = true;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (receptionist && receptionist.doctorId === schedule.doctorId) authorized = true;
  }
  if (!authorized) return { ok: false, message: "Not authorized" };

  const result = await cancelScheduleBlock(scheduleId, reason);
  if (!result.success) return { ok: false, message: result.error };

  // Send cancellation emails
  if (result.cancelledAppointments > 0) {
    const slots = await prisma.scheduleSlot.findMany({
      where: { scheduleId },
      include: {
        appointment: {
          include: { doctor: true },
        },
      },
    });

    for (const slot of slots) {
      const appt = slot.appointment;
      if (!appt) continue;
      if (appt.patientEmail) {
        try {
          await sendCancellationEmail({
            to: appt.patientEmail,
            patientName: appt.patientName,
            doctorName: appt.doctor.fullName,
            serialNumber: appt.serialNumber,
            reason: reason || "Chamber off",
          });
        } catch (e) {
          console.error("Failed to send cancellation email:", e);
        }
      }
      // SMS
      try {
        const smsEnabled = await isSmsEnabled(appt.doctorId);
        if (smsEnabled) {
          const sent = await sendCancellationSms({
            to: appt.patientPhone,
            patientName: appt.patientName,
            doctorName: appt.doctor.fullName,
            serialNumber: appt.serialNumber,
          });
          if (sent.success) {
            await decrementSmsCredit(
              appt.doctorId,
              1,
              `Cancellation for ${appt.patientName}`
            );
          }
        }
      } catch (e) {
        console.error("Failed to send cancellation SMS:", e);
      }
    }
  }

  revalidatePath("/dashboard/schedules");
  revalidatePath("/dashboard/queue");
  return {
    ok: true,
    message: result.cancelledAppointments > 0
      ? `Schedule cancelled. ${result.cancelledAppointments} appointment(s) cancelled and patients notified.`
      : "Schedule cancelled",
  };
}

export async function getScheduleBlocksAction() {
  const session = await auth();
  if (!session?.user) return [];

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) return [];
    doctorId = doctor.id;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (!receptionist) return [];
    doctorId = receptionist.doctorId;
  }

  const blocks = await getDoctorScheduleBlocks(doctorId);
  return blocks.map((b) => ({
    ...b,
    effectiveFrom: b.effectiveFrom.toISOString(),
    effectiveTo: b.effectiveTo?.toISOString() || null,
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  }));
}

export async function getAvailableDatesAction(doctorId: number) {
  return getNextAvailableDates(doctorId, 30);
}

export async function getAvailableSlotsAction(doctorId: number, date: string) {
  return getAvailableSlots(doctorId, date);
}

// =====================================================================
// Booking Actions
// =====================================================================

interface BookAppointmentInput {
  slotId: number;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  chiefComplaint?: string;
}

export async function bookAppointmentAction(input: BookAppointmentInput) {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, message: "Please log in to book an appointment" };
  }

  try {
    const slot = await prisma.scheduleSlot.findUnique({
      where: { id: input.slotId },
      include: {
        doctor: { include: { specialty: true, user: true } },
      },
    });

    if (!slot) return { ok: false, message: "Slot not found" };
    if (slot.status !== "AVAILABLE") {
      return { ok: false, message: "This slot is no longer available" };
    }
    if (slot.slotDate < new Date(new Date().setHours(0, 0, 0, 0))) {
      return { ok: false, message: "Cannot book a past date" };
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedSlot = await tx.scheduleSlot.update({
        where: { id: input.slotId, status: "AVAILABLE" },
        data: { status: "BOOKED" },
      });

      if (!updatedSlot) {
        throw new Error("Slot was just booked by someone else");
      }

      const appt = await tx.appointment.create({
        data: {
          slotId: input.slotId,
          doctorId: slot.doctorId,
          patientId: Number(session.user.id),
          patientName: input.patientName,
          patientPhone: input.patientPhone,
          patientEmail: input.patientEmail || null,
          serialNumber: slot.serialNumber,
          bookingSource: "ONLINE",
          bookedByUserId: Number(session.user.id),
          status: "SCHEDULED",
          chiefComplaint: input.chiefComplaint || null,
        },
      });

      return appt;
    });

    await calculateQueueEstimates(slot.doctorId, slot.slotDate);

    if (input.patientEmail || session.user.email) {
      try {
        await sendBookingConfirmationEmail({
          to: input.patientEmail || session.user.email!,
          patientName: input.patientName,
          doctorName: slot.doctor.fullName,
          specialty: slot.doctor.specialty?.name || null,
          serialNumber: slot.serialNumber,
          slotDate: slot.slotDate,
          startTime: slot.startTime,
        });
      } catch (e) {
        console.error("Failed to send confirmation email:", e);
      }
    }

    try {
      const smsEnabled = await isSmsEnabled(slot.doctorId);
      if (smsEnabled) {
        const sent = await sendBookingSms({
          to: input.patientPhone,
          patientName: input.patientName,
          doctorName: slot.doctor.fullName,
          serialNumber: slot.serialNumber,
          slotDate: slot.slotDate,
          startTime: slot.startTime,
        });
        if (sent.success) {
          await decrementSmsCredit(slot.doctorId, 1, `Booking confirmation for serial #${slot.serialNumber}`);
        }
      }
    } catch (e) {
      console.error("Failed to send SMS:", e);
    }

    revalidatePath(`/doctor/${slot.doctor.slug}`);
    revalidatePath("/dashboard/appointments");
    return {
      ok: true,
      message: "Appointment booked successfully!",
      data: { appointmentId: result.id, serialNumber: slot.serialNumber },
    };
  } catch (error: any) {
    console.error("Book appointment error:", error);
    if (error.message?.includes("Slot was just booked")) {
      return { ok: false, message: "This slot was just booked by someone else. Please choose another time." };
    }
    return { ok: false, message: "Failed to book appointment" };
  }
}

export async function getPatientAppointmentsAction() {
  const session = await auth();
  if (!session?.user) return [];

  return prisma.appointment.findMany({
    where: { patientId: Number(session.user.id) },
    include: {
      doctor: { select: { fullName: true, slug: true, specialty: { select: { name: true } } } },
      slot: true,
    },
    orderBy: { slot: { slotDate: "desc" } },
    take: 50,
  });
}

export async function getQueueForDateAction(date: string) {
  const session = await auth();
  if (!session?.user) return null;

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) return null;
    doctorId = doctor.id;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (!receptionist) return null;
    doctorId = receptionist.doctorId;
  }

  const targetDate = new Date(`${date}T00:00:00.000Z`);
  const slots = await prisma.scheduleSlot.findMany({
    where: { doctorId, slotDate: targetDate },
    include: {
      facility: {
        include: {
          upazila: {
            include: {
              district: true,
            },
          },
        },
      },
      schedule: {
        select: {
          id: true,
          startTime: true,
          endTime: true,
          notes: true,
        },
      },
      appointment: {
        include: {
          patient: { select: { id: true, name: true, phone: true, image: true } },
        },
      },
    },
    orderBy: [{ startTime: "asc" }, { serialNumber: "asc" }],
  });

  return { date: targetDate, slots };
}

export async function getUpcomingDatesAction() {
  const session = await auth();
  if (!session?.user) return [];

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) return [];
    doctorId = doctor.id;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (!receptionist) return [];
    doctorId = receptionist.doctorId;
  }

  const todayStr = getDhakaDateString(new Date());
  const today = new Date(`${todayStr}T00:00:00.000Z`);
  const future = new Date(today);
  future.setUTCDate(today.getUTCDate() + 30);

  const slots = await prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      slotDate: { gte: today, lte: future },
    },
    select: { slotDate: true },
    distinct: ["slotDate"],
    orderBy: { slotDate: "asc" },
  });

  return slots.map((s) => getDhakaDateString(s.slotDate));
}

export async function startNextPatientAction() {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) return { ok: false, message: "No doctor profile" };
    doctorId = doctor.id;
  } else {
    const receptionist = await prisma.receptionist.findUnique({
      where: { userId },
      include: { doctor: true },
    });
    if (!receptionist || !receptionist.canCancel) {
      return { ok: false, message: "Not authorized" };
    }
    doctorId = receptionist.doctorId;
  }

  const today = new Date();
  const next = await startNextAppointment(doctorId, today);

  if (!next) {
    return { ok: false, message: "No more patients in queue" };
  }

  try {
    if (next.patientEmail) {
      await sendQueueAdvanceEmail({
        to: next.patientEmail,
        patientName: next.patientName,
        doctorName: session.user.name || "Doctor",
        serialNumber: next.serialNumber,
      });
    }
    const smsEnabled = await isSmsEnabled(doctorId);
    if (smsEnabled) {
      const sent = await sendQueueAdvanceSms({
        to: next.patientPhone,
        patientName: next.patientName,
        doctorName: session.user.name || "Doctor",
        serialNumber: next.serialNumber,
      });
      if (sent.success) {
        await decrementSmsCredit(doctorId, 1, `Queue advance for serial #${next.serialNumber}`);
      }
    }
  } catch (e) {
    console.error("Failed to send queue advance notifications:", e);
  }

  revalidatePath("/dashboard/queue");
  return { ok: true, message: `Now seeing serial #${next.serialNumber}`, data: { appointment: next } };
}

export async function cancelAppointmentAction(appointmentId: number, reason: string) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: { include: { user: true } } },
  });
  if (!appt) return { ok: false, message: "Appointment not found" };

  const isPatient = appt.patientId === userId;
  const isDoctorOwner = appt.doctor.userId === userId;
  const isAdmin = userRole === "ADMIN";
  const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
  const isReceptionist = receptionist?.doctorId === appt.doctorId && receptionist.canCancel;

  if (!isPatient && !isDoctorOwner && !isAdmin && !isReceptionist) {
    return { ok: false, message: "Not authorized to cancel" };
  }

  const result = await cancelAppointment(appointmentId, userId, reason);
  if (!result.success) return { ok: false, message: result.error };

  await prisma.scheduleSlot.update({
    where: { id: appt.slotId },
    data: { status: "AVAILABLE" },
  });

  try {
    if (appt.patientEmail) {
      await sendCancellationEmail({
        to: appt.patientEmail,
        patientName: appt.patientName,
        doctorName: appt.doctor.fullName,
        serialNumber: appt.serialNumber,
        reason,
      });
    }
    const smsEnabled = await isSmsEnabled(appt.doctorId);
    if (smsEnabled) {
      const sent = await sendCancellationSms({
        to: appt.patientPhone,
        patientName: appt.patientName,
        doctorName: appt.doctor.fullName,
        serialNumber: appt.serialNumber,
      });
      if (sent.success) {
        await decrementSmsCredit(appt.doctorId, 1, `Cancellation for serial #${appt.serialNumber}`);
      }
    }
  } catch (e) {
    console.error("Failed to send cancellation notifications:", e);
  }

  revalidatePath("/dashboard/queue");
  revalidatePath("/dashboard/appointments");
  return { ok: true, message: "Appointment cancelled" };
}

export async function markNoShowAction(appointmentId: number) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { doctor: { include: { user: true } } },
  });
  if (!appt) return { ok: false, message: "Appointment not found" };

  const isDoctorOwner = appt.doctor.userId === userId;
  const isAdmin = userRole === "ADMIN";
  const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
  const isReceptionist = receptionist?.doctorId === appt.doctorId && receptionist.canMarkNoShow;

  if (!isDoctorOwner && !isAdmin && !isReceptionist) {
    return { ok: false, message: "Not authorized" };
  }

  const result = await markNoShow(appointmentId);
  if (!result.success) return { ok: false, message: result.error };

  revalidatePath("/dashboard/queue");
  return { ok: true, message: "Marked as no-show" };
}

export async function bookOfflineAppointmentAction(input: {
  slotId: number;
  patientName: string;
  patientPhone: string;
  chiefComplaint?: string;
}) {
  const session = await auth();
  if (!session?.user) return { ok: false, message: "Unauthorized" };

  const userId = Number(session.user.id);
  const receptionist = await prisma.receptionist.findUnique({
    where: { userId },
    include: { doctor: true },
  });
  if (!receptionist || !receptionist.canBookOffline) {
    return { ok: false, message: "Not authorized" };
  }

  const slot = await prisma.scheduleSlot.findUnique({ where: { id: input.slotId } });
  if (!slot) return { ok: false, message: "Slot not found" };
  if (slot.status !== "AVAILABLE") {
    return { ok: false, message: "Slot is not available" };
  }

  let walkInUser = await prisma.user.findFirst({
    where: { phone: input.patientPhone },
  });
  if (!walkInUser) {
    const bcrypt = await import("bcryptjs");
    const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-12), 10);
    walkInUser = await prisma.user.create({
      data: {
        name: input.patientName,
        email: `walkin_${Date.now()}_${input.patientPhone.replace(/\D/g, "")}@walkin.local`,
        password: tempPassword,
        phone: input.patientPhone,
        role: "PATIENT",
        isActive: true,
      },
    });
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.scheduleSlot.update({
      where: { id: input.slotId, status: "AVAILABLE" },
      data: { status: "BOOKED" },
    });
    if (!updated) throw new Error("Slot already booked");

    return tx.appointment.create({
      data: {
        slotId: input.slotId,
        doctorId: slot.doctorId,
        patientId: walkInUser!.id,
        patientName: input.patientName,
        patientPhone: input.patientPhone,
        serialNumber: slot.serialNumber,
        bookingSource: "WALK_IN",
        bookedByReceptionistId: receptionist.id,
        status: "SCHEDULED",
        chiefComplaint: input.chiefComplaint || null,
      },
    });
  });

  await calculateQueueEstimates(slot.doctorId, slot.slotDate);

  revalidatePath("/dashboard/queue");
  return {
    ok: true,
    message: `Walk-in serial #${slot.serialNumber} booked for ${input.patientName}`,
    data: { appointmentId: result.id, serialNumber: slot.serialNumber },
  };
}
