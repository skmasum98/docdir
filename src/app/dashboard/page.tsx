import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums";
import DoctorProfileForm from "./doctor-profile-form";
import UserReviews from "./user-reviews";

export const metadata = { title: "Dashboard | Doctor Directory" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const role = session.user.role;
  const sp = await searchParams;
  const saved = sp.saved === "1";

  if (role === UserRole.DOCTOR || role === UserRole.ADMIN) {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: Number(session.user.id) },
      include: { specialty: true },
    });
    const specialties = await prisma.specialty.findMany({ orderBy: { name: "asc" } });

    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-3xl font-semibold text-slate-900">Doctor dashboard</h1>
        <p className="mt-1 text-sm text-slate-600">
          Update your public profile. Changes are visible immediately after admin review.
        </p>
        {saved && (
          <div className="mt-6 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            Profile saved.
          </div>
        )}
        <div className="mt-6">
          {doctor ? (
            <DoctorProfileForm
              doctor={{
                id: doctor.id,
                fullName: doctor.fullName,
                gender: doctor.gender ?? null,
                bmdcNumber: doctor.bmdcNumber ?? "",
                experienceYears: doctor.experienceYears ?? 0,
                consultationFee: doctor.consultationFee ?? 0,
                about: doctor.about ?? "",
                phone: doctor.phone ?? "",
                email: doctor.email ?? "",
                website: doctor.website ?? "",
                facebook: doctor.facebook ?? "",
                linkedin: doctor.linkedin ?? "",
                hospitalName: doctor.hospitalName ?? "",
                chamberAddress: doctor.chamberAddress ?? "",
                city: doctor.city ?? "",
                area: doctor.area ?? "",
                specialtyId: doctor.specialtyId ?? null,
                slug: doctor.slug,
              }}
              specialties={specialties.map((s) => ({ id: s.id, name: s.name }))}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
              <p className="text-sm text-slate-700">
                No doctor profile is linked to your account yet.{" "}
                <Link href="/dashboard/claim" className="font-semibold text-slate-900 hover:underline">
                  Claim an existing profile
                </Link>{" "}
                or ask an admin to create one.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  const reviews = await prisma.review.findMany({
    where: { userId: Number(session.user.id) },
    include: { doctor: { select: { slug: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Your account</h1>
      <p className="mt-1 text-sm text-slate-600">Signed in as {session.user.email}</p>
      <div className="mt-6">
        <UserReviews
          reviews={reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment ?? "",
            isApproved: r.isApproved,
            doctorSlug: r.doctor.slug,
            doctorName: r.doctor.fullName,
          }))}
        />
      </div>
    </main>
  );
}
