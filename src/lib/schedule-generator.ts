import { prisma } from "./prisma";
import { getDhakaDateString, dhakaDateToUTC, getDhakaDayOfWeek, startOfDayDhaka } from "./timezone";

/**
 * Create slots for a specific date with given time range.
 * Called manually by doctor or receptionist.
 *
 * Each call creates one "schedule block" for the day with:
 * - startTime, endTime, slotDuration, maxPatients, facilityId, notes (chamber off notice)
 */
export interface CreateSlotInput {
  doctorId: number;
  facilityId?: number | null;
  date: string; // YYYY-MM-DD in Dhaka timezone
  startTime: string; // "17:00"
  endTime: string; // "21:00"
  slotDuration: number; // minutes
  maxPatients: number;
  notes?: string; // Optional notice (e.g., "Chamber off" or special note)
  createdById: number;
}

export async function createSlotsForDate(input: CreateSlotInput): Promise<{
  created: number;
  error?: string;
  scheduleBlockId?: number;
}> {
  // Validate inputs
  if (!input.date || !input.startTime || !input.endTime) {
    return { created: 0, error: "Date and times are required" };
  }
  if (input.maxPatients < 1 || input.maxPatients > 500) {
    return { created: 0, error: "Max patients must be between 1 and 500" };
  }
  if (input.slotDuration < 1 || input.slotDuration > 120) {
    return { created: 0, error: "Slot duration must be between 1 and 120 minutes" };
  }

  // Parse times
  const [startHour, startMin] = input.startTime.split(":").map(Number);
  const [endHour, endMin] = input.endTime.split(":").map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  if (endMinutes <= startMinutes) {
    return { created: 0, error: "End time must be after start time" };
  }

  const totalMinutes = endMinutes - startMinutes;
  const slotCount = Math.min(
    input.maxPatients,
    Math.floor(totalMinutes / input.slotDuration)
  );

  if (slotCount === 0) {
    return { created: 0, error: `Time range too short for ${input.slotDuration}-min slots` };
  }

  // Check date is in the future (Dhaka)
  const todayDhaka = getDhakaDateString(new Date());
  if (input.date < todayDhaka) {
    return { created: 0, error: "Cannot create slots in the past" };
  }

  // Parse date as Dhaka date
  const targetDateUTC = new Date(`${input.date}T00:00:00.000Z`);

  // Insert one "Schedule" record as a one-time block
  const schedule = await prisma.schedule.create({
    data: {
      doctorId: input.doctorId,
      facilityId: input.facilityId || null,
      dayOfWeek: getDhakaDayOfWeek(targetDateUTC),
      startTime: input.startTime,
      endTime: input.endTime,
      slotDuration: input.slotDuration,
      maxPatients: input.maxPatients,
      effectiveFrom: targetDateUTC,
      effectiveTo: targetDateUTC, // Same day - one-time block
      isActive: true,
      createdById: input.createdById,
      notes: input.notes || null,
    },
  });

  // Create slots
  const slots = [];
  for (let i = 0; i < slotCount; i++) {
    const slotStartMin = startMinutes + i * input.slotDuration;
    const slotEndMin = slotStartMin + input.slotDuration;

    const startH = String(Math.floor(slotStartMin / 60)).padStart(2, "0");
    const startM = String(slotStartMin % 60).padStart(2, "0");
    const endH = String(Math.floor(slotEndMin / 60)).padStart(2, "0");
    const endM = String(slotEndMin % 60).padStart(2, "0");

    const startTimeStr = `${input.date}T${startH}:${startM}:00+06:00`;
    const endTimeStr = `${input.date}T${endH}:${endM}:00+06:00`;

    slots.push({
      scheduleId: schedule.id,
      doctorId: input.doctorId,
      facilityId: input.facilityId || null,
      slotDate: targetDateUTC,
      startTime: new Date(startTimeStr),
      endTime: new Date(endTimeStr),
      serialNumber: i + 1,
    });
  }

  const result = await prisma.scheduleSlot.createMany({
    data: slots,
  });

  return { created: result.count, scheduleBlockId: schedule.id };
}

/**
 * Update an existing schedule block (doctor's chamber time for a specific date)
 */
export async function updateScheduleBlock(
  scheduleId: number,
  input: {
    startTime?: string;
    endTime?: string;
    slotDuration?: number;
    maxPatients?: number;
    notes?: string | null;
    isActive?: boolean;
  }
): Promise<{ success: boolean; error?: string }> {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { success: false, error: "Schedule not found" };

  await prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      startTime: input.startTime,
      endTime: input.endTime,
      slotDuration: input.slotDuration,
      maxPatients: input.maxPatients,
      notes: input.notes,
      isActive: input.isActive !== undefined ? input.isActive : true,
    },
  });

  return { success: true };
}

/**
 * Delete a schedule block and all its slots
 * (with check for already-booked slots)
 */
export async function deleteScheduleBlock(scheduleId: number): Promise<{
  success: boolean;
  cancelledAppointments: number;
  error?: string;
}> {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { success: false, cancelledAppointments: 0, error: "Schedule not found" };

  // Find all slots and their appointments
  const slots = await prisma.scheduleSlot.findMany({
    where: { scheduleId },
    include: { appointment: true },
  });

  let cancelledAppointments = 0;

  // Cancel all appointments and notify patients
  for (const slot of slots) {
    if (slot.appointment) {
      await prisma.appointment.update({
        where: { id: slot.appointment.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: "Doctor deleted this schedule block",
        },
      });
      cancelledAppointments++;
    }
  }

  // Delete all slots
  await prisma.scheduleSlot.deleteMany({ where: { scheduleId } });
  // Delete the schedule block
  await prisma.schedule.delete({ where: { id: scheduleId } });

  return { success: true, cancelledAppointments };
}

/**
 * Mark an entire schedule block as "chamber off" (cancel all slots and appointments)
 */
export async function cancelScheduleBlock(
  scheduleId: number,
  reason: string
): Promise<{ success: boolean; cancelledAppointments: number; error?: string }> {
  const schedule = await prisma.schedule.findUnique({ where: { id: scheduleId } });
  if (!schedule) return { success: false, cancelledAppointments: 0, error: "Schedule not found" };

  const slots = await prisma.scheduleSlot.findMany({
    where: { scheduleId },
    include: { appointment: true },
  });

  let cancelledAppointments = 0;

  for (const slot of slots) {
    if (slot.appointment) {
      await prisma.appointment.update({
        where: { id: slot.appointment.id },
        data: {
          status: "CANCELLED",
          cancelledAt: new Date(),
          cancellationReason: reason || "Chamber off",
        },
      });
      cancelledAppointments++;
    }
    // Block the slot
    await prisma.scheduleSlot.update({
      where: { id: slot.id },
      data: { status: "BLOCKED", blockedReason: reason || "Chamber off" },
    });
  }

  // Update schedule to mark as inactive
  await prisma.schedule.update({
    where: { id: scheduleId },
    data: { isActive: false, notes: reason || schedule.notes },
  });

  return { success: true, cancelledAppointments };
}

/**
 * Get all schedule blocks (chamber dates) for a doctor
 */
export async function getDoctorScheduleBlocks(doctorId: number) {
  return prisma.schedule.findMany({
    where: { doctorId },
    orderBy: [{ effectiveFrom: "asc" }, { startTime: "asc" }],
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
      doctor: {
        select: {
          hospitalName: true,
          chamberAddress: true,
          city: true,
          area: true,
        },
      },
      _count: { select: { slots: true } },
    },
  });
}

/**
 * Get schedule blocks within a date range
 */
export async function getScheduleBlocksInRange(
  doctorId: number,
  startDate: string,
  endDate: string
) {
  return prisma.schedule.findMany({
    where: {
      doctorId,
      effectiveFrom: {
        gte: new Date(`${startDate}T00:00:00.000Z`),
        lte: new Date(`${endDate}T23:59:59.999Z`),
      },
    },
    orderBy: { effectiveFrom: "asc" },
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
      doctor: {
        select: {
          hospitalName: true,
          chamberAddress: true,
          city: true,
          area: true,
        },
      },
      _count: { select: { slots: true } },
    },
  });
}

/**
 * Get available slots for a doctor on a given date (in Dhaka timezone)
 */
export async function getAvailableSlots(doctorId: number, date: string) {
  const targetDate = new Date(`${date}T00:00:00.000Z`);
  return prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      slotDate: targetDate,
      status: "AVAILABLE",
    },
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
      doctor: {
        select: {
          hospitalName: true,
          chamberAddress: true,
          city: true,
          area: true,
          appointmentPhone: true,
          phone: true,
        },
      },
      schedule: {
        select: {
          notes: true,
          isActive: true,
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}

/**
 * Get the next available dates for a doctor (next N days that have slots)
 */
export async function getNextAvailableDates(doctorId: number, daysAhead: number = 30): Promise<string[]> {
  const datesArray: Date[] = [];
  const todayStr = getDhakaDateString(new Date());
  const startDay = new Date(`${todayStr}T00:00:00.000Z`);

  for (let i = 0; i < daysAhead; i++) {
    const d = new Date(startDay);
    d.setUTCDate(startDay.getUTCDate() + i);
    datesArray.push(d);
  }

  const slots = await prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      slotDate: {
        in: datesArray,
      },
      status: "AVAILABLE",
    },
    select: { slotDate: true },
    distinct: ["slotDate"],
    orderBy: { slotDate: "asc" },
  });

  return slots.map((s) => getDhakaDateString(s.slotDate));
}
