import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { deleteDoctorAction } from "@/lib/actions/admin";
import { UserAvatar } from "@/components/user-avatar";

export const metadata = { title: "Doctors | Admin" };

const PAGE_SIZE = 20;

type Props = {
  searchParams: Promise<{ saved?: string; q?: string; page?: string | string[] }>;
};

function toSingleParam(value: string | string[] | undefined): string | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    const last = value[value.length - 1];
    return last ? last.trim() || undefined : undefined;
  }
  const trimmed = value.trim();
  return trimmed || undefined;
}

export default async function AdminDoctorsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = toSingleParam(sp.q)?.trim() ?? "";
  const requestedPage = Math.max(1, Number(toSingleParam(sp.page) ?? "1") || 1);

  const [doctors, totalCount] = await Promise.all([
    prisma.doctor.findMany({
      where: q ? { fullName: { contains: q } } : undefined,
      orderBy: { createdAt: "desc" },
      skip: (requestedPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        specialty: { select: { name: true } },
        doctorFacilities: { select: { id: true } },
      },
    }),
    prisma.doctor.count({
      where: q ? { fullName: { contains: q } } : undefined,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const page = Math.min(requestedPage, totalPages);
  const hasPrevPage = page > 1;
  const hasNextPage = page < totalPages;

  const buildPageHref = (nextPage: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (sp.saved === "1") params.set("saved", "1");
    params.set("page", String(nextPage));
    return `/admin/doctors?${params.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Doctors</h1>
          <p className="text-xs text-slate-500 mt-1">Manage verified medical specialists and physician profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/doctors/import"
            className="rounded-2xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-900 hover:bg-indigo-100 transition inline-flex items-center gap-1.5 shadow-2xs"
          >
            <span>⚡ Bulk Import (CSV / TSV)</span>
          </Link>
          <Link
            href="/admin/doctors/new"
            className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition"
          >
            Add doctor
          </Link>
        </div>
      </div>

      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </div>
      )}

      <form method="get" action="/admin/doctors" className="flex gap-2">
        <input type="hidden" name="page" value="1" />
        <input
          name="q"
          defaultValue={q}
          placeholder="Search by name..."
          className="w-full max-w-md rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <button className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
          Search
        </button>
      </form>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Specialty</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Facilities</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {doctors.map((d) => (
              <tr key={d.id}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar src={d.profilePhoto} name={d.fullName} size="sm" />
                    <Link
                      href={`/admin/doctors/${d.id}`}
                      className="font-semibold text-slate-900 hover:underline"
                    >
                      {d.fullName}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3 text-slate-600">{d.specialty?.name ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{d.city ?? "—"}</td>
                <td className="px-4 py-3 text-slate-600">{d.doctorFacilities.length}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${
                      d.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-800"
                        : d.status === "BLOCKED"
                        ? "bg-rose-50 text-rose-800"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {d.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteDoctorAction} className="inline">
                    <input type="hidden" name="id" value={d.id} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {doctors.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                  No doctors found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
          <div>
            Showing {Math.min((page - 1) * PAGE_SIZE + 1, totalCount)}-{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={buildPageHref(page - 1)}
              aria-disabled={!hasPrevPage}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${
                hasPrevPage
                  ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "pointer-events-none cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              Previous
            </Link>
            <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Page {page} / {totalPages}
            </span>
            <Link
              href={buildPageHref(page + 1)}
              aria-disabled={!hasNextPage}
              className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${
                hasNextPage
                  ? "border-slate-300 text-slate-700 hover:bg-slate-50"
                  : "pointer-events-none cursor-not-allowed border-slate-200 text-slate-400"
              }`}
            >
              Next
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
