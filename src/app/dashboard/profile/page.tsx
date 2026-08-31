import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums";
import DoctorProfileForm from "../doctor-profile-form";
import ProfileSection from "../profile-section";
import { ArrowLeft, Stethoscope, Building2, User, ChevronRight } from "lucide-react";

export const metadata = {
  title: "Profile & Settings | Doctor Directory",
  description: "Update your personal credentials, contact info, and profile details.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function DashboardProfilePage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) redirect("/login");

  const role = currentUser.role;
  const sp = await searchParams;
  const saved = sp.saved === "1";

  const userData = {
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    image: currentUser.image,
    role: currentUser.role,
  };

  // If Doctor or Admin with doctor profile
  const doctor = await prisma.doctor.findFirst({
    where: { userId: currentUser.id },
    include: {
      specialty: true,
      doctorFacilities: {
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
        },
      },
    },
  });

  const specialties = await prisma.specialty.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        {doctor && (
          <Link
            href={`/doctor/${doctor.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            View Public Page <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
          {doctor ? "Doctor Profile & Account Settings" : "Account Profile & Settings"}
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          {doctor
            ? "Manage your professional medical credentials, chamber addresses, consultation fees, and login security."
            : "Manage your personal profile picture, contact number, and password security."}
        </p>
      </div>

      {saved && (
        <div
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="alert"
        >
          Changes saved successfully.
        </div>
      )}

      {/* User Profile & Image CRUD */}
      <section>
        <ProfileSection user={userData} />
      </section>

      {/* Doctor Professional Profile (If Doctor) */}
      {doctor && (
        <section className="space-y-4 pt-2">
          <DoctorProfileForm
            doctor={{
              id: doctor.id,
              fullName: doctor.fullName,
              profilePhoto: doctor.profilePhoto,
              degrees: doctor.degrees ?? "",
              designation: doctor.designation ?? "",
              gender: doctor.gender ?? null,
              bmdcNumber: doctor.bmdcNumber ?? "",
              experienceYears: doctor.experienceYears ?? 0,
              consultationFee: doctor.consultationFee ?? 0,
              followUpFee: doctor.followUpFee ?? 0,
              visitingHours: doctor.visitingHours ?? "",
              services: doctor.services ?? "",
              about: doctor.about ?? "",
              phone: doctor.phone ?? "",
              appointmentPhone: doctor.appointmentPhone ?? "",
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
            attachedFacilities={doctor.doctorFacilities.map((df) => ({
              id: df.facility.id,
              name: df.facility.name,
              type: df.facility.type,
              address: df.facility.address,
              phone: df.facility.phone,
              location: [df.facility.upazila?.name, df.facility.upazila?.district?.name]
                .filter(Boolean)
                .join(", "),
            }))}
          />
        </section>
      )}
    </main>
  );
}
