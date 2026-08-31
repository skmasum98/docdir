import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDhakaDateString, getTodayDhaka, dhakaDateToUTC } from "@/lib/timezone";
import QueueManager from "./queue-manager";

export const metadata = {
  title: "Queue Management | Dr Chamber Directory",
  description: "Manage today's patient queue and upcoming bookings in real-time.",
  robots: { index: false, follow: false },
};

export default async function QueuePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  if (userRole !== "DOCTOR" && userRole !== "ADMIN" && userRole !== "FACILITY_ADMIN") {
    redirect("/dashboard");
  }

  // Get the doctor record
  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) redirect("/dashboard");
    doctorId = doctor.id;
  } else {
    const receptionist = await prisma.receptionist.findUnique({
      where: { userId },
      include: { doctor: true },
    });
    if (!receptionist) redirect("/dashboard");
    doctorId = receptionist.doctorId;
  }

  // Get today in Dhaka
  const todayDhaka = getTodayDhaka();
  const todayDate = dhakaDateToUTC(todayDhaka);

  // Get all upcoming dates (today + next 30 days) that have slots
  const future = new Date(todayDate);
  future.setUTCDate(future.getUTCDate() + 30);

  const upcomingSlots = await prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      slotDate: { gte: todayDate, lte: future },
    },
    select: { slotDate: true },
    distinct: ["slotDate"],
    orderBy: { slotDate: "asc" },
  });

  const availableDates = upcomingSlots.map((s) => getDhakaDateString(s.slotDate));

  // Get today's slots
  const todaySlots = await prisma.scheduleSlot.findMany({
    where: { doctorId, slotDate: todayDate },
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

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    select: { fullName: true, avgConsultationMinutes: true },
  });

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Queue Management</h1>
          <p className="text-sm text-slate-600">
            {doctor ? `${doctor.fullName} • ` : ""}Manage live patient queue and upcoming bookings
          </p>
        </div>
        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
          ⏱ Avg. {doctor?.avgConsultationMinutes || 10} min/patient
        </div>
      </header>

      <QueueManager
        doctorId={doctorId}
        todayDate={todayDhaka}
        availableDates={availableDates}
        initialTodaySlots={todaySlots.map((s) => ({
          id: s.id,
          serialNumber: s.serialNumber,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
          status: s.status,
          facility: s.facility
            ? {
                id: s.facility.id,
                name: s.facility.name,
                type: s.facility.type,
                address: s.facility.address,
                phone: s.facility.phone,
                upazila: s.facility.upazila
                  ? {
                      name: s.facility.upazila.name,
                      district: s.facility.upazila.district
                        ? { name: s.facility.upazila.district.name }
                        : null,
                    }
                  : null,
              }
            : null,
          schedule: s.schedule
            ? {
                id: s.schedule.id,
                startTime: s.schedule.startTime,
                endTime: s.schedule.endTime,
                notes: s.schedule.notes,
              }
            : null,
          appointment: s.appointment
            ? {
                id: s.appointment.id,
                status: s.appointment.status,
                patientName: s.appointment.patientName,
                patientPhone: s.appointment.patientPhone,
                patientId: s.appointment.patientId,
                serialNumber: s.appointment.serialNumber,
                bookingSource: s.appointment.bookingSource,
                chiefComplaint: s.appointment.chiefComplaint,
                estimatedTime: s.appointment.estimatedTime?.toISOString() || null,
                actualStartTime: s.appointment.actualStartTime?.toISOString() || null,
              }
            : null,
        }))}
      />
    </main>
  );
}
