import { prisma } from "@/lib/prisma";
import { claimDecisionAction, facilityClaimDecisionAction } from "@/lib/actions/admin";
import { ClaimStatus } from "@/lib/enums";
import Link from "next/link";
import {
  Stethoscope,
  Building2,
  Phone,
  Mail,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  MapPin,
  ExternalLink,
} from "lucide-react";

export const metadata = { title: "Claims Management | Admin" };

type Props = {
  searchParams: Promise<{ type?: string; filter?: string }>;
};

export default async function AdminClaimsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const claimType = sp.type === "facilities" ? "facilities" : "doctors";
  const filter = sp.filter ?? "pending";

  const statusWhere =
    filter === "all"
      ? {}
      : { status: filter === "pending" ? ClaimStatus.PENDING : (filter.toUpperCase() as ClaimStatus) };

  // Fetch Doctor Claims
  const doctorClaims =
    claimType === "doctors"
      ? await prisma.doctorClaim.findMany({
          where: statusWhere,
          orderBy: { createdAt: "desc" },
          include: {
            doctor: { select: { id: true, fullName: true, slug: true, specialty: true } },
            user: { select: { name: true, email: true, phone: true } },
          },
        })
      : [];

  // Fetch Facility Claims
  const facilityClaims =
    claimType === "facilities"
      ? await prisma.facilityClaim.findMany({
          where: statusWhere,
          orderBy: { createdAt: "desc" },
          include: {
            facility: {
              select: {
                id: true,
                name: true,
                slug: true,
                type: true,
                phone: true,
                hotline: true,
                upazila: { select: { name: true, district: { select: { name: true } } } },
              },
            },
            user: { select: { name: true, email: true, phone: true } },
          },
        })
      : [];

  // Count pending totals for badge notification
  const [pendingDoctorCount, pendingFacilityCount] = await Promise.all([
    prisma.doctorClaim.count({ where: { status: ClaimStatus.PENDING } }),
    prisma.facilityClaim.count({ where: { status: ClaimStatus.PENDING } }),
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Verification & Claims
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Review and authorize profile ownership claims from verified Doctors and Medical Institutes.
          </p>
        </div>
      </div>

      {/* Primary Category Selector Tabs */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 pb-3">
        <Link
          href={`/admin/claims?type=doctors&filter=${filter}`}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            claimType === "doctors"
              ? "bg-slate-950 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          <span>Doctor Profile Claims</span>
          {pendingDoctorCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                claimType === "doctors" ? "bg-amber-400 text-slate-950" : "bg-amber-100 text-amber-900"
              }`}
            >
              {pendingDoctorCount}
            </span>
          )}
        </Link>

        <Link
          href={`/admin/claims?type=facilities&filter=${filter}`}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold transition ${
            claimType === "facilities"
              ? "bg-slate-950 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Hospital & Clinic Claims</span>
          {pendingFacilityCount > 0 && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                claimType === "facilities" ? "bg-amber-400 text-slate-950" : "bg-amber-100 text-amber-900"
              }`}
            >
              {pendingFacilityCount}
            </span>
          )}
        </Link>
      </div>

      {/* Sub-Filters by status */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2 text-xs font-medium">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <Link
              key={f}
              href={`/admin/claims?type=${claimType}&filter=${f}`}
              className={`rounded-xl border px-3.5 py-1.5 capitalize transition ${
                filter === f
                  ? "border-slate-900 bg-slate-900 text-white font-semibold"
                  : "border-slate-300 text-slate-700 hover:bg-slate-100 bg-white"
              }`}
            >
              {f}
            </Link>
          ))}
        </div>
      </div>

      {/* DOCTOR CLAIMS LIST */}
      {claimType === "doctors" && (
        <div className="space-y-4">
          {doctorClaims.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-2.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        c.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {c.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Submitted on {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Claimant: {c.user?.name || "Registered User"}
                    </h2>
                    <p className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                      <span>{c.user?.email}</span>
                      {c.user?.phone && <span>· Phone: {c.user.phone}</span>}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100 text-sm space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span className="text-slate-600">Claiming Profile:</span>
                      {c.doctor ? (
                        <Link
                          href={`/doctor/${c.doctor.slug}`}
                          target="_blank"
                          className="font-bold text-indigo-700 hover:underline flex items-center gap-1"
                        >
                          {c.doctor.fullName}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-500">Deleted doctor</span>
                      )}
                    </div>

                    {c.bmdcNumber && (
                      <p className="text-xs text-slate-700">
                        <strong className="font-semibold">BMDC Registration:</strong> {c.bmdcNumber}
                      </p>
                    )}

                    {c.licenseImage && (
                      <p className="text-xs">
                        <strong className="font-semibold">Credential Certificate:</strong>{" "}
                        <a
                          href={c.licenseImage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 underline hover:text-indigo-800"
                        >
                          View Uploaded Document
                        </a>
                      </p>
                    )}

                    {c.note && (
                      <div className="mt-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                        <strong className="block text-slate-800 mb-0.5">Claimant Note:</strong>
                        {c.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {c.status === ClaimStatus.PENDING && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <form action={claimDecisionAction}>
                      <input type="hidden" name="claimId" value={c.id} />
                      <input type="hidden" name="status" value={ClaimStatus.APPROVED} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve Claim
                      </button>
                    </form>

                    <form action={claimDecisionAction}>
                      <input type="hidden" name="claimId" value={c.id} />
                      <input type="hidden" name="status" value={ClaimStatus.REJECTED} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Claim
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}

          {doctorClaims.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <Clock className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-800">No doctor claims found</p>
              <p className="text-xs text-slate-500 mt-1">There are no doctor claims matching this status filter.</p>
            </div>
          )}
        </div>
      )}

      {/* FACILITY CLAIMS LIST */}
      {claimType === "facilities" && (
        <div className="space-y-4">
          {facilityClaims.map((fc) => (
            <div
              key={fc.id}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="space-y-3 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
                        fc.status === "APPROVED"
                          ? "bg-emerald-100 text-emerald-800"
                          : fc.status === "REJECTED"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {fc.status}
                    </span>
                    <span className="text-xs text-slate-400">
                      Submitted on {new Date(fc.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      Applicant: {fc.user?.name || "Representative"} ({fc.designation || "Institute Authority"})
                    </h2>
                    <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3 mt-0.5">
                      <span>Email: {fc.officialEmail || fc.user?.email}</span>
                      <span>· Official Contact: {fc.officialPhone}</span>
                    </p>
                  </div>

                  <div className="rounded-2xl bg-teal-50/40 p-4 border border-teal-100 text-sm space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-teal-700 shrink-0" />
                      <span className="text-slate-600">Claiming Institute:</span>
                      {fc.facility ? (
                        <Link
                          href={`/facility/${fc.facility.slug}`}
                          target="_blank"
                          className="font-bold text-teal-800 hover:underline flex items-center gap-1"
                        >
                          {fc.facility.name}
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-slate-500">Deleted facility</span>
                      )}
                    </div>

                    {fc.facility?.upazila && (
                      <p className="text-xs text-slate-600 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>
                          {fc.facility.upazila.name}
                          {fc.facility.upazila.district?.name ? `, ${fc.facility.upazila.district.name}` : ""}
                        </span>
                      </p>
                    )}

                    {fc.tradeLicenseNumber && (
                      <p className="text-xs text-slate-700">
                        <strong className="font-semibold">Trade / DGHS Reg License:</strong> {fc.tradeLicenseNumber}
                      </p>
                    )}

                    {fc.tradeLicenseImage && (
                      <p className="text-xs">
                        <strong className="font-semibold">License Document:</strong>{" "}
                        <a
                          href={fc.tradeLicenseImage}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 underline hover:text-teal-900"
                        >
                          View License Image
                        </a>
                      </p>
                    )}

                    {fc.authorizationLetter && (
                      <p className="text-xs">
                        <strong className="font-semibold">Authorization Letter:</strong>{" "}
                        <a
                          href={fc.authorizationLetter}
                          target="_blank"
                          rel="noreferrer"
                          className="text-teal-700 underline hover:text-teal-900"
                        >
                          View Authorization Doc
                        </a>
                      </p>
                    )}

                    {fc.note && (
                      <div className="mt-2 text-xs text-slate-700 bg-white p-2.5 rounded-xl border border-teal-100">
                        <strong className="block text-slate-900 mb-0.5">Verification Details / Note:</strong>
                        {fc.note}
                      </div>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {fc.status === ClaimStatus.PENDING && (
                  <div className="flex sm:flex-col gap-2 shrink-0">
                    <form action={facilityClaimDecisionAction}>
                      <input type="hidden" name="claimId" value={fc.id} />
                      <input type="hidden" name="status" value={ClaimStatus.APPROVED} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Assign Manager Role
                      </button>
                    </form>

                    <form action={facilityClaimDecisionAction}>
                      <input type="hidden" name="claimId" value={fc.id} />
                      <input type="hidden" name="status" value={ClaimStatus.REJECTED} />
                      <button
                        type="submit"
                        className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject Claim
                      </button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          ))}

          {facilityClaims.length === 0 && (
            <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center">
              <Building2 className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-2 text-sm font-semibold text-slate-800">No hospital / clinic claims found</p>
              <p className="text-xs text-slate-500 mt-1">There are no facility claims matching this status filter.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
