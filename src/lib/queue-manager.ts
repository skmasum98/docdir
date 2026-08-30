import { prisma } from "./prisma";
import type { Appointment } from "@prisma/client";

/**
 * Calculate estimated appointment times for all bookings on a given date
 * for a given doctor. Used to show patients how long they have to wait.
 *
 * Algorithm:
 * 1. Get all active appointments for the day in serial order
 * 2. First appointment starts at first slot's start time
 * 3. Each subsequent appointment starts when previous ends
 * 4. Account for COMPLETED appointments (subtract their actual duration)
 */
export async function calculateQueueEstimates(doctorId: number, date: Date): Promise<void> {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { avgConsultationMinutes: true },
  });
  const avgMin = doctor?.avgConsultationMinutes ?? 10;

  const slots = await prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      slotDate: dateOnly,
    },
    orderBy: { startTime: "asc" },
    include: { appointment: true },
  });

  // Calculate estimated time for each booked slot
  let currentEstimate = null;
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    if (!slot.appointment) continue;

    // For the first slot, start at the slot's start time
    // For subsequent slots, start after the previous appointment
    if (i === 0) {
      currentEstimate = slot.startTime;
    } else if (currentEstimate) {
      currentEstimate = new Date(currentEstimate.getTime() + avgMin * 60 * 1000);
    }

    // Update the appointment's estimated time
    if (currentEstimate) {
      await prisma.appointment.update({
        where: { id: slot.appointment.id },
        data: { estimatedTime: currentEstimate },
      });
    }
  }
}

/**
 * Get queue information for a patient appointment.
 * Returns: position (0-indexed), people ahead, estimated time.
 */
export async function getQueueInfo(appointmentId: number): Promise<{
  position: number;
  totalActive: number;
  peopleAhead: number;
  estimatedTime: Date | null;
  status: string;
  serialNumber: number;
} | null> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { slot: true },
  });

  if (!appt) return null;

  // Get all active appointments for the same doctor on the same date
  const dateOnly = new Date(appt.slot.slotDate);
  const activeAppts = await prisma.appointment.findMany({
    where: {
      doctorId: appt.doctorId,
      slot: { slotDate: dateOnly },
      status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
    },
    include: { slot: true },
    orderBy: { serialNumber: "asc" },
  });

  const position = activeAppts.findIndex((a) => a.id === appointmentId);
  const inProgress = activeAppts.findIndex((a) => a.status === "IN_PROGRESS");
  const aheadCount = position === -1 ? 0 : position;
  const peopleAhead = position === -1
    ? 0
    : activeAppts.slice(inProgress >= 0 ? inProgress : 0, position).filter(
        (a) => a.status === "SCHEDULED" || a.status === "CONFIRMED"
      ).length;

  return {
    position,
    totalActive: activeAppts.length,
    peopleAhead,
    estimatedTime: appt.estimatedTime,
    status: appt.status,
    serialNumber: appt.serialNumber,
  };
}

/**
 * Mark the next appointment as in_progress and others as completed/queued.
 * Called when doctor starts seeing a patient.
 */
export async function startNextAppointment(doctorId: number, date: Date): Promise<Appointment | null> {
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  // Mark any currently in-progress appointment as completed
  await prisma.appointment.updateMany({
    where: {
      doctorId,
      status: "IN_PROGRESS",
      slot: { slotDate: dateOnly },
    },
    data: {
      status: "COMPLETED",
      actualEndTime: new Date(),
    },
  });

  // Find the next scheduled appointment
  const next = await prisma.appointment.findFirst({
    where: {
      doctorId,
      status: { in: ["SCHEDULED", "CONFIRMED"] },
      slot: { slotDate: dateOnly },
    },
    include: { slot: true },
    orderBy: { serialNumber: "asc" },
  });

  if (!next) return null;

  // Mark as in progress
  const updated = await prisma.appointment.update({
    where: { id: next.id },
    data: {
      status: "IN_PROGRESS",
      actualStartTime: new Date(),
    },
  });

  // Recalculate estimates
  await calculateQueueEstimates(doctorId, dateOnly);

  return updated;
}

/**
 * Cancel an appointment and free its slot.
 */
export async function cancelAppointment(
  appointmentId: number,
  cancelledByUserId: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { slot: true },
  });

  if (!appt) return { success: false, error: "Appointment not found" };
  if (appt.status === "CANCELLED") return { success: false, error: "Already cancelled" };
  if (appt.status === "COMPLETED") return { success: false, error: "Already completed" };

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
      cancelledByUserId,
      cancellationReason: reason,
    },
  });

  // Recalculate queue estimates since the queue has shifted
  await calculateQueueEstimates(appt.doctorId, appt.slot.slotDate);

  return { success: true };
}

/**
 * Mark appointment as no-show.
 */
export async function markNoShow(appointmentId: number): Promise<{ success: boolean; error?: string }> {
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { slot: true },
  });

  if (!appt) return { success: false, error: "Appointment not found" };
  if (appt.status === "CANCELLED") return { success: false, error: "Already cancelled" };

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "NO_SHOW" },
  });

  // Free the slot
  await prisma.scheduleSlot.update({
    where: { id: appt.slotId },
    data: { status: "AVAILABLE" },
  });

  // Recalculate estimates
  await calculateQueueEstimates(appt.doctorId, appt.slot.slotDate);

  return { success: true };
}
