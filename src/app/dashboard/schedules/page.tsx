import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getScheduleBlocksAction } from "@/lib/actions/queue";
import ScheduleBlocksManager from "./schedules-manager";

export const metadata = {
  title: "Schedule Management | Dr Chamber Directory",
  description: "Create and manage chamber schedules for specific dates with patient slots.",
  robots: { index: false, follow: false },
};

export default async function SchedulesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  // Allow doctors, admins, and receptionists
  if (userRole !== "DOCTOR" && userRole !== "ADMIN" && userRole !== "FACILITY_ADMIN") {
    // Check if they're a receptionist
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (!receptionist) redirect("/dashboard");
  }

  // Get doctor ID
  let doctorId: number;
  if (userRole === "DOCTOR" || userRole === "ADMIN" || userRole === "FACILITY_ADMIN") {
    const doctor = await prisma.doctor.findFirst({ where: { userId } });
    if (!doctor) redirect("/dashboard");
    doctorId = doctor.id;
  } else {
    const receptionist = await prisma.receptionist.findUnique({ where: { userId } });
    if (!receptionist) redirect("/dashboard");
    doctorId = receptionist.doctorId;
  }

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId },
    include: {
      user: { select: { name: true } },
    },
  });

  const facilities = await prisma.facility.findMany({
    where: {
      OR: [
        { userId },
        { doctorFacilities: { some: { doctorId } } },
      ],
    },
    select: { id: true, name: true, type: true, address: true },
    orderBy: { name: "asc" },
  });

  // Get all schedule blocks
  const initialBlocks = await getScheduleBlocksAction();

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Schedule Management</h1>
        <p className="text-sm text-slate-600">
          Create chamber schedules for specific dates. Pick a date, set times, and let patients book online.
        </p>
        {doctor && (
          <p className="text-xs text-slate-500">
            👨‍⚕️ {doctor.fullName}
            {userRole === "FACILITY_ADMIN" || (userRole === "PATIENT" && facilities.length > 0)
              ? " (receptionist access)"
              : null}
          </p>
        )}
      </header>

      <ScheduleBlocksManager
        doctorId={doctorId}
        facilities={facilities}
        initialBlocks={initialBlocks}
      />
    </main>
  );
}
