import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClaimForm from "./claim-form";

export const metadata = { title: "Claim profile | Doctor Directory" };

type Props = { searchParams: Promise<{ doctorId?: string }> };

export default async function ClaimPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/claim");

  const sp = await searchParams;
  const doctorId = sp.doctorId ? Number(sp.doctorId) : null;

  const doctors = await prisma.doctor.findMany({
    where: { profileClaimed: false, status: "PUBLISHED" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, specialty: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Claim your profile</h1>
      <p className="mt-1 text-sm text-slate-600">
        Search for your name and submit a claim. An admin will review your BMDC details
        before approval.
      </p>
      <div className="mt-6">
        <ClaimForm doctors={doctors} initialDoctorId={doctorId} />
      </div>
    </main>
  );
}
