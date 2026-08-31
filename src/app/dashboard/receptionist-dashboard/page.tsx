import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTodayDhaka, dhakaDateToUTC, getDhakaDateString } from "@/lib/timezone";
import QueueManager from "../queue/queue-manager";

export const metadata = {
  title: "Receptionist Dashboard | Dr Chamber Directory",
  description: "Manage patient queue, book walk-ins, and handle chamber schedules.",
  robots: { index: false, follow: false },
};

export default async function ReceptionistDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);

  // Check if user is a receptionist
  const receptionist = await prisma.receptionist.findUnique({
    where: { userId },
    include: {
      doctor: {
        include: { user: { select: { name: true } } },
      },
    },
  });

  if (!receptionist) {
    redirect("/dashboard");
  }

  const doctorId = receptionist.doctorId;
  const todayDhaka = getTodayDhaka();
  const today = dhakaDateToUTC(todayDhaka);

  // Get today's slots
  const slots = await prisma.scheduleSlot.findMany({
    where: { doctorId, slotDate: today },
    include: {
      appointment: {
        include: {
          patient: { select: { id: true, name: true, phone: true, image: true } },
        },
      },
    },
    orderBy: { serialNumber: "asc" },
  });

  // Get upcoming dates with slots
  const future = new Date(today);
  future.setUTCDate(future.getUTCDate() + 30);
  const upcomingSlots = await prisma.scheduleSlot.findMany({
    where: {
      doctorId,
      slotDate: { gte: today, lte: future },
    },
    select: { slotDate: true },
    distinct: ["slotDate"],
    orderBy: { slotDate: "asc" },
  });

  const availableDates = upcomingSlots.map((s) => getDhakaDateString(s.slotDate));

  // Today's stats
  const totalSlots = slots.length;
  const bookedCount = slots.filter((s) => s.appointment && s.appointment.status !== "CANCELLED" && s.appointment.status !== "NO_SHOW").length;
  const completedCount = slots.filter((s) => s.appointment?.status === "COMPLETED").length;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Receptionist Dashboard</h1>
          <p className="text-sm text-slate-600">
            Working with <strong>{receptionist.doctor.fullName}</strong>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full self-start sm:self-auto">
          ⏱ Avg. {receptionist.doctor.avgConsultationMinutes || 10} min/patient
        </div>
      </header>

      {/* Quick info about permissions */}
      <section className="rounded-3xl border border-blue-200 bg-blue-50/50 p-4 sm:p-5">
        <h2 className="text-sm font-bold text-blue-900 mb-2">Your Permissions</h2>
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className={`rounded-md px-2 py-1 font-semibold ${receptionist.canBookOffline ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {receptionist.canBookOffline ? "✓" : "✗"} Book Walk-ins
          </span>
          <span className={`rounded-md px-2 py-1 font-semibold ${receptionist.canCancel ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {receptionist.canCancel ? "✓" : "✗"} Cancel Appointments
          </span>
          <span className={`rounded-md px-2 py-1 font-semibold ${receptionist.canMarkNoShow ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
            {receptionist.canMarkNoShow ? "✓" : "✗"} Mark No-show
          </span>
        </div>
      </section>

      <QueueManager
        doctorId={doctorId}
        todayDate={todayDhaka}
        availableDates={availableDates}
        initialTodaySlots={slots.map((s) => ({
          id: s.id,
          serialNumber: s.serialNumber,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
          status: s.status,
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

      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 text-center text-sm text-slate-600">
        <p>
          💡 Need to manage schedules?{" "}
          <a href="/dashboard/schedules" className="text-indigo-600 font-semibold hover:underline">
            Go to Schedule Management
          </a>
        </p>
      </div>
    </main>
  );
}
