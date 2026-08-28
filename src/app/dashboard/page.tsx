import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums";
import DoctorProfileForm from "./doctor-profile-form";
import UserReviews from "./user-reviews";
import ProfileSection from "./profile-section";
import { Building2, Stethoscope, ShieldCheck, ChevronRight, FlaskConical, UserCheck } from "lucide-react";

export const metadata = { 
  title: "Dashboard | Doctor Directory Bangladesh",
  description: "Manage your medical credentials, hospital facilities, diagnostic test catalogs, and patient reviews.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
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

  // Check for facilities owned/managed by this user
  const userFacilities = await prisma.facility.findMany({
    where: { userId: currentUser.id },
    include: {
      tests: { select: { id: true } },
      doctorFacilities: { select: { id: true } },
    },
  });

  // Doctor or Admin View
  if (role === UserRole.DOCTOR || (role === UserRole.ADMIN && !userFacilities.length)) {
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
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Doctor Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage your medical credentials, visiting schedule, chamber addresses, and patient reviews.
          </p>
        </div>

        {saved && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="alert">
            Changes saved successfully.
          </div>
        )}

        {/* User Profile & Image CRUD */}
        <ProfileSection user={userData} />

        {/* Doctor Information */}
        <div className="pt-2">
          {doctor ? (
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
                location: [
                  df.facility.upazila?.name,
                  df.facility.upazila?.district?.name,
                ]
                  .filter(Boolean)
                  .join(", "),
              }))}
            />
          ) : (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <p className="text-sm text-slate-700">
                No doctor profile is linked to your account yet.{" "}
                <Link href="/search" className="font-semibold text-slate-900 hover:underline">
                  Find and claim your profile
                </Link>{" "}
                or ask an admin to create one.
              </p>
            </div>
          )}
        </div>
      </main>
    );
  }

  // Facility Admin or User with Managed Facilities
  if (role === UserRole.FACILITY_ADMIN || userFacilities.length > 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Hospital & Clinic Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your medical facilities, hotlines, diagnostic test catalogs, and doctor rosters.
            </p>
          </div>
          <Link
            href="/dashboard/facility"
            className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Building2 className="h-4 w-4" />
            Open Facility Suite
          </Link>
        </div>

        {saved && (
          <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="alert">
            Changes saved successfully.
          </div>
        )}

        {/* Facility Cards */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-700" />
            Your Managed Medical Facilities ({userFacilities.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userFacilities.map((fac) => (
              <div
                key={fac.id}
                className="rounded-3xl border border-teal-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <span className="rounded-lg bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800 uppercase">
                    {fac.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{fac.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Hotline: {fac.hotline || fac.phone || "Not set"}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5 text-teal-600" />
                      {fac.tests.length} Tests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                      {fac.doctorFacilities.length} Doctors
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <Link
                    href={`/facility/${fac.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    View Public
                  </Link>
                  <Link
                    href={`/dashboard/facility`}
                    className="rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                  >
                    Manage Suite →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Profile & Image CRUD */}
        <ProfileSection user={userData} />
      </main>
    );
  }

  // Patient / Standard User View
  const reviews = await prisma.review.findMany({
    where: { userId: currentUser.id },
    include: { doctor: { select: { slug: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10 space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Your Account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage your account profile image, personal info, and review activity.
        </p>
      </div>

      {saved && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900" role="alert">
          Changes saved successfully.
        </div>
      )}

      {/* Professional & Institute Claim Prompt Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Stethoscope className="h-4 w-4 text-indigo-600" />
            Are you a practicing Doctor?
          </div>
          <p className="text-xs text-indigo-950/80 leading-relaxed">
            Verify and claim your doctor listing to edit chamber timings, fees, and patient booking hotlines.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            Find & Claim Profile <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
            <Building2 className="h-4 w-4 text-teal-700" />
            Hospital or Diagnostic Representative?
          </div>
          <p className="text-xs text-teal-950/80 leading-relaxed">
            Claim official management to publish diagnostic test prices, manage doctor schedules, and emergency contacts.
          </p>
          <Link
            href="/dashboard/claim-facility"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950"
          >
            Claim Medical Institute <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* User Profile & Image CRUD */}
      <ProfileSection user={userData} />

      {/* User Reviews */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-8 shadow-sm">
        <h2 className="text-lg sm:text-xl font-semibold text-slate-900 mb-4">Your Reviews</h2>
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
