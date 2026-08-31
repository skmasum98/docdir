import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getQueueInfo } from "@/lib/queue-manager";
import PatientAppointmentsView from "./appointments-view";

export const metadata = {
  title: "My Appointments | Dr Chamber Directory",
  description: "View and manage your doctor appointments, see live queue position.",
  robots: { index: false, follow: false },
};

export default async function PatientAppointmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const appointments = await prisma.appointment.findMany({
    where: { patientId: Number(session.user.id) },
    include: {
      doctor: {
        select: {
          fullName: true,
          slug: true,
          specialty: { select: { name: true } },
          profilePhoto: true,
          hospitalName: true,
          chamberAddress: true,
          city: true,
          area: true,
          appointmentPhone: true,
        },
      },
      slot: {
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
              phone: true,
              upazila: {
                select: {
                  name: true,
                  district: { select: { name: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { slot: { slotDate: "desc" } },
    take: 50,
  });

  // Get queue info for upcoming appointments
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const enrichedAppointments = await Promise.all(
    appointments.map(async (appt) => {
      let queueInfo = null;
      if (
        appt.slot.slotDate >= today &&
        (appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS")
      ) {
        const qi = await getQueueInfo(appt.id);
        if (qi) {
          queueInfo = {
            ...qi,
            estimatedTime: qi.estimatedTime ? qi.estimatedTime.toISOString() : null,
          };
        }
      }
      return {
        ...appt,
        slot: {
          ...appt.slot,
          slotDate: appt.slot.slotDate.toISOString(),
          startTime: appt.slot.startTime.toISOString(),
          endTime: appt.slot.endTime.toISOString(),
          createdAt: appt.slot.createdAt.toISOString(),
          updatedAt: appt.slot.updatedAt.toISOString(),
        },
        estimatedTime: appt.estimatedTime?.toISOString() || null,
        actualStartTime: appt.actualStartTime?.toISOString() || null,
        actualEndTime: appt.actualEndTime?.toISOString() || null,
        cancelledAt: appt.cancelledAt?.toISOString() || null,
        createdAt: appt.createdAt.toISOString(),
        updatedAt: appt.updatedAt.toISOString(),
        queueInfo,
      };
    })
  );

  return <PatientAppointmentsView initialAppointments={enrichedAppointments as any} />;
}
