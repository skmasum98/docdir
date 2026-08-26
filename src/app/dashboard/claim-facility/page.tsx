import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Building2, ShieldCheck, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";
import ClaimFacilityForm from "./claim-facility-form";

export const metadata = { title: "Claim Hospital / Clinic Profile | Doctor Directory" };

type Props = {
  searchParams: Promise<{ facilityId?: string; success?: string }>;
};

export default async function ClaimFacilityPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) {
    const sp = await searchParams;
    const returnUrl = sp.facilityId
      ? `/dashboard/claim-facility?facilityId=${sp.facilityId}`
      : "/dashboard/claim-facility";
    redirect(`/login?callbackUrl=${encodeURIComponent(returnUrl)}`);
  }

  const userId = Number(session.user.id);
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { phone: true, email: true, name: true },
  });

  const sp = await searchParams;
  const preselectedFacilityId = sp.facilityId ? Number(sp.facilityId) : null;
  const isSuccess = sp.success === "1";

  // Fetch facilities that are unclaimed or already selected
  const facilities = await prisma.facility.findMany({
    where: {
      OR: [
        { profileClaimed: false },
        preselectedFacilityId ? { id: preselectedFacilityId } : {},
      ],
    },
    orderBy: { name: "asc" },
    take: 200,
    select: {
      id: true,
      name: true,
      type: true,
      phone: true,
      hotline: true,
      address: true,
      profileClaimed: true,
      upazila: {
        select: {
          name: true,
          district: { select: { name: true } },
        },
      },
    },
  });

  // Check existing claims by this user
  const userClaims = await prisma.facilityClaim.findMany({
    where: { userId: Number(session.user.id) },
    include: {
      facility: {
        select: {
          id: true,
          name: true,
          slug: true,
          type: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/dashboard" className="hover:text-slate-900 transition">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-slate-900">Claim Medical Facility</span>
      </nav>

      {/* Header Banner */}
      <div className="rounded-3xl border border-teal-200 bg-gradient-to-br from-teal-50/80 via-white to-teal-50/40 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs shrink-0">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Hospital & Diagnostic Center Verification
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Claim ownership to update official hotlines, publish diagnostic test prices, and manage practicing doctor rosters.
            </p>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {isSuccess && (
        <div className="rounded-3xl border border-emerald-300 bg-emerald-50 p-6 shadow-xs flex items-start gap-4">
          <CheckCircle2 className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-bold text-emerald-950">Claim Request Submitted Successfully</h3>
            <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
              Our administration team is reviewing your authorization credentials. Once approved, you will receive full access to the Facility Management Portal under your account.
            </p>
          </div>
        </div>
      )}

      {/* User's Previous Claims Status */}
      {userClaims.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-teal-600" />
            Your Submitted Facility Claims
          </h2>

          <div className="divide-y divide-slate-100">
            {userClaims.map((claim) => (
              <div key={claim.id} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {claim.facility?.name || "Medical Institute"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Designation: {claim.designation} · Contact: {claim.officialPhone}
                  </p>
                </div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-xl px-2.5 py-1 text-xs font-bold uppercase tracking-wider ${
                      claim.status === "APPROVED"
                        ? "bg-emerald-100 text-emerald-800"
                        : claim.status === "REJECTED"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification Form Card */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <ClaimFacilityForm
          facilities={facilities}
          preselectedFacilityId={preselectedFacilityId}
          userEmail={currentUser?.email || session.user.email || ""}
          userName={currentUser?.name || session.user.name || ""}
          userPhone={currentUser?.phone || ""}
        />
      </div>
    </main>
  );
}
