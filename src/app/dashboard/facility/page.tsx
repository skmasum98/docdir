import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums";
import { Building2, Plus, Stethoscope, Sparkles, Phone, ShieldCheck, ChevronRight } from "lucide-react";
import FacilityManagerView from "./facility-manager-view";

export const metadata = { title: "Facility & Clinic Management Portal | Doctor Directory" };

type Props = {
  searchParams: Promise<{ saved?: string; tab?: string }>;
};

export default async function FacilityDashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) redirect("/login");

  // Check if user is FACILITY_ADMIN or ADMIN, or has claimed a facility
  const isAuthorizedRole = currentUser.role === UserRole.FACILITY_ADMIN || currentUser.role === UserRole.ADMIN;

  // Fetch facilities managed by this user (or all if ADMIN)
  const facilities = await prisma.facility.findMany({
    where: isAuthorizedRole && currentUser.role === UserRole.ADMIN ? {} : { userId },
    include: {
      upazila: {
        include: { district: { include: { division: true } } },
      },
      tests: {
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
      doctorFacilities: {
        include: {
          doctor: {
            include: {
              specialty: true,
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  // If no claimed facilities, redirect to claim page
  if (facilities.length === 0) {
    return (
      <main className="mx-auto max-w-4xl px-4 sm:px-6 py-12 space-y-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4">
          <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <Building2 className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">No Claimed Medical Institute Found</h1>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            You have not yet claimed or been assigned management of a Hospital, Clinic, or Diagnostic Center profile.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/claim-facility"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-6 py-3 text-sm font-bold text-white hover:bg-teal-800 transition shadow-xs"
            >
              <ShieldCheck className="h-4 w-4" />
              Claim Your Hospital or Diagnostic Profile
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Fetch all specialties and list of doctors for doctor link search
  const [specialties, availableDoctors] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.doctor.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { fullName: "asc" },
      take: 200,
      select: {
        id: true,
        fullName: true,
        degrees: true,
        specialty: { select: { name: true } },
        phone: true,
      },
    }),
  ]);

  const sp = await searchParams;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/dashboard" className="hover:text-slate-900 transition">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-900">Institute Management</span>
      </nav>

      {/* Main Suite View */}
      <FacilityManagerView
        facilities={facilities}
        specialties={specialties}
        availableDoctors={availableDoctors}
        initialTab={sp.tab || "profile"}
        isSaved={sp.saved === "1"}
      />
    </main>
  );
}
