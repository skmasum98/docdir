import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listReceptionistsAction } from "@/lib/actions/receptionist";
import ReceptionistsManager from "./receptionists-manager";

export const metadata = {
  title: "Receptionists | Dr Chamber Directory",
  description: "Create and manage receptionist accounts to handle your patient queue offline.",
  robots: { index: false, follow: false },
};

export default async function ReceptionistsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findFirst({
    where: { userId: Number(session.user.id) },
  });

  if (!doctor) {
    redirect("/dashboard");
  }

  const receptionists = await prisma.receptionist.findMany({
    where: { doctorId: doctor.id },
    include: { user: { select: { id: true, name: true, email: true, isActive: true } } },
    orderBy: { createdAt: "desc" },
  });

  const formatted = receptionists.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }));

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>

      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Receptionists</h1>
        <p className="text-sm text-slate-600 mt-1">
          Create accounts for your chamber staff to manage offline bookings and the queue.
        </p>
      </header>

      <ReceptionistsManager
        doctorName={doctor.fullName}
        initialReceptionists={formatted}
      />
    </main>
  );
}
