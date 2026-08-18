import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { DoctorStatus, ClaimStatus } from "@/lib/enums";

export const metadata = { title: "Admin | Doctor Directory" };

export default async function AdminHomePage() {
  const [doctors, specialties, facilities, users, pendingClaims, pendingReviews] =
    await Promise.all([
      prisma.doctor.count(),
      prisma.specialty.count(),
      prisma.facility.count(),
      prisma.user.count(),
      prisma.doctorClaim.count({ where: { status: ClaimStatus.PENDING } }),
      prisma.review.count({ where: { isApproved: false } }),
    ]);

  const stats: { label: string; value: number; href?: string }[] = [
    { label: "Doctors", value: doctors, href: "/admin/doctors" },
    { label: "Specialties", value: specialties, href: "/admin/specialties" },
    { label: "Facilities", value: facilities, href: "/admin/facilities" },
    { label: "Users", value: users, href: "/admin/users" },
    { label: "Pending claims", value: pendingClaims, href: "/admin/claims" },
    { label: "Reviews awaiting approval", value: pendingReviews, href: "/admin/reviews" },
  ];

  const recentDoctors = await prisma.doctor.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { specialty: { select: { name: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">Admin overview</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage doctors, specialties, facilities, regions, users and content.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {s.label}
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{s.value}</p>
            {s.href && (
              <Link
                href={s.href}
                className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline"
              >
                Manage
              </Link>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Recently added doctors</h2>
          <Link
            href="/admin/doctors/new"
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Add doctor
          </Link>
        </div>
        {recentDoctors.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No doctors yet.</p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {recentDoctors.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <Link
                    href={`/admin/doctors/${d.id}`}
                    className="font-semibold text-slate-900 hover:underline"
                  >
                    {d.fullName}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {d.specialty?.name ?? "No specialty"} &middot; {d.city ?? "—"}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    d.status === DoctorStatus.PUBLISHED
                      ? "bg-emerald-50 text-emerald-800"
                      : d.status === DoctorStatus.BLOCKED
                      ? "bg-rose-50 text-rose-800"
                      : "bg-amber-50 text-amber-800"
                  }`}
                >
                  {d.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
