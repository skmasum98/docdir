import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SmsManager from "./sms-manager";

export const metadata = {
  title: "SMS Notifications | Dr Chamber Directory",
  description: "Manage SMS notifications for your patient bookings. Powered by BulkSMS BD.",
  robots: { index: false, follow: false },
};

export default async function SmsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  if (session.user.role !== "DOCTOR" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const doctor = await prisma.doctor.findFirst({
    where: { userId: Number(session.user.id) },
  });

  if (!doctor) redirect("/dashboard");

  const balance = await prisma.smsBalance.findUnique({
    where: { doctorId: doctor.id },
  });

  const transactions = await prisma.smsTransaction.findMany({
    where: { balance: { doctorId: doctor.id } },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  const stats = {
    totalCredits: balance?.totalCredits || 0,
    usedCredits: balance?.usedCredits || 0,
    remaining: (balance?.totalCredits || 0) - (balance?.usedCredits || 0),
    smsEnabled: balance?.smsEnabled || false,
    lastTopupAt: balance?.lastTopupAt?.toISOString() || null,
    autoDisableAt: balance?.autoDisableAt?.toISOString() || null,
  };

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">SMS Notifications</h1>
        <p className="text-sm text-slate-600 mt-1">
          Send booking confirmations, queue updates, and reminders to patients via SMS.
        </p>
      </header>

      <SmsManager
        doctorId={doctor.id}
        doctorName={doctor.fullName}
        doctorPhone={doctor.phone}
        stats={stats}
        transactions={transactions.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
          completedAt: t.completedAt?.toISOString() || null,
        }))}
      />
    </main>
  );
}
