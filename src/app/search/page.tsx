import Link from "next/link";
import { prisma, Prisma } from "@/lib/prisma";
import { DoctorStatus } from "@/lib/enums";

export const metadata = { title: "Search | Doctor Directory" };

type Props = {
  searchParams: Promise<{
    q?: string;
    division?: string;
    district?: string;
    upazila?: string;
    specialty?: string;
    facility?: string;
    gender?: string;
    verified?: string;
    minFee?: string;
    maxFee?: string;
    page?: string;
  }>;
};

const PAGE_SIZE = 12;

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const doctorWhere: Prisma.DoctorWhereInput = { status: DoctorStatus.PUBLISHED };

  if (sp.q) {
    doctorWhere.OR = [
      { fullName: { contains: sp.q } },
      { hospitalName: { contains: sp.q } },
      { chamberAddress: { contains: sp.q } },
      { about: { contains: sp.q } },
    ];
  }
  if (sp.gender) {
    doctorWhere.gender = sp.gender as "MALE" | "FEMALE" | "OTHER";
  }
  if (sp.verified === "1") {
    doctorWhere.isVerified = true;
  }
  if (sp.minFee || sp.maxFee) {
    const fee: Prisma.IntNullableFilter = {};
    if (sp.minFee) fee.gte = Number(sp.minFee);
    if (sp.maxFee) fee.lte = Number(sp.maxFee);
    doctorWhere.consultationFee = fee;
  }
  if (sp.specialty) {
    doctorWhere.specialty = { slug: sp.specialty };
  }
  if (sp.facility) {
    doctorWhere.doctorFacilities = { some: { facility: { slug: sp.facility } } };
  }
  if (sp.upazila) {
    doctorWhere.doctorFacilities = {
      some: { facility: { upazila: { slug: sp.upazila } } },
    };
  }
  if (sp.district) {
    doctorWhere.doctorFacilities = {
      some: { facility: { upazila: { district: { slug: sp.district } } } },
    };
  }
  if (sp.division) {
    doctorWhere.doctorFacilities = {
      some: {
        facility: {
          upazila: { district: { division: { slug: sp.division } } },
        },
      },
    };
  }

  const [divisions, specialties, total, doctors] = await Promise.all([
    prisma.division.findMany({
      orderBy: { name: "asc" },
      include: { districts: { orderBy: { name: "asc" } } },
    }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.doctor.count({ where: doctorWhere }),
    prisma.doctor.findMany({
      where: doctorWhere,
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        specialty: { select: { name: true, slug: true } },
        doctorFacilities: {
          include: {
            facility: { select: { name: true, slug: true } },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const [districts, upazilas, facilities] = await Promise.all([
    sp.division
      ? Promise.resolve(divisions.find((d) => d.slug === sp.division)?.districts ?? [])
      : Promise.resolve([]),
    sp.district
      ? prisma.upazila.findMany({
          where: { district: { slug: sp.district } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    sp.upazila
      ? prisma.facility.findMany({
          where: { upazila: { slug: sp.upazila } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged = { ...sp, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    return `/search?${params.toString()}`;
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-3xl font-semibold text-slate-900">Find a doctor</h1>
      <p className="mt-1 text-sm text-slate-600">
        {total} doctor{total === 1 ? "" : "s"} found.
      </p>

      <form className="mt-6 flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:flex-row md:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Doctor name, hospital, area..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button className="rounded-2xl bg-slate-950 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800">
          Search
        </button>
      </form>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-6">
          <FilterGroup title="Specialty">
            <ul className="space-y-1">
              <li>
                <Link
                  href={buildQuery({ specialty: undefined, page: undefined })}
                  className={`block rounded-xl px-3 py-1.5 text-sm ${
                    !sp.specialty ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
                  }`}
                >
                  All
                </Link>
              </li>
              {specialties.map((s) => (
                <li key={s.id}>
                  <Link
                    href={buildQuery({ specialty: s.slug, page: undefined })}
                    className={`block rounded-xl px-3 py-1.5 text-sm ${
                      sp.specialty === s.slug
                        ? "bg-slate-100 font-semibold"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </FilterGroup>

          <FilterGroup title="Division">
            <select
              name="division"
              defaultValue={sp.division ?? ""}
              className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
              onChange={undefined}
              form="search-filters"
            >
              <option value="">All</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </FilterGroup>

          <FilterGroup title="Filters">
            <form
              id="search-filters"
              action="/search"
              method="get"
              className="space-y-3 text-sm"
            >
              {sp.q && <input type="hidden" name="q" value={sp.q} />}
              {sp.specialty && <input type="hidden" name="specialty" value={sp.specialty} />}
              {sp.division && <input type="hidden" name="division" value={sp.division} />}

              {districts.length > 0 && (
                <div>
                  <label className="mb-1 block font-medium text-slate-700">District</label>
                  <select
                    name="district"
                    defaultValue={sp.district ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    {districts.map((d) => (
                      <option key={d.id} value={d.slug}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {upazilas.length > 0 && (
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Upazila</label>
                  <select
                    name="upazila"
                    defaultValue={sp.upazila ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    {upazilas.map((u) => (
                      <option key={u.id} value={u.slug}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {facilities.length > 0 && (
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Hospital/Facility</label>
                  <select
                    name="facility"
                    defaultValue={sp.facility ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">All</option>
                    {facilities.map((f) => (
                      <option key={f.id} value={f.slug}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block font-medium text-slate-700">Gender</label>
                <select
                  name="gender"
                  defaultValue={sp.gender ?? ""}
                  className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="">Any</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Min fee</label>
                  <input
                    name="minFee"
                    type="number"
                    min={0}
                    defaultValue={sp.minFee ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1 block font-medium text-slate-700">Max fee</label>
                  <input
                    name="maxFee"
                    type="number"
                    min={0}
                    defaultValue={sp.maxFee ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="verified"
                  value="1"
                  defaultChecked={sp.verified === "1"}
                  className="h-4 w-4"
                />
                <span>Verified only</span>
              </label>

              <button className="w-full rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
                Apply filters
              </button>
            </form>
          </FilterGroup>
        </aside>

        <section>
          {doctors.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              No doctors match these filters.
            </div>
          ) : (
            <div className="space-y-4">
              {doctors.map((d) => (
                <Link
                  key={d.id}
                  href={`/doctor/${d.slug}`}
                  className="block rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        {d.fullName}
                        {d.isVerified && (
                          <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800">
                            ✓ Verified
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-slate-600">
                        {d.specialty?.name ?? "General"}{" "}
                        {d.experienceYears !== null && `· ${d.experienceYears} yrs exp.`}
                      </p>
                    </div>
                    {d.consultationFee !== null && (
                      <span className="rounded-2xl border border-slate-200 px-3 py-1 text-sm font-semibold">
                        ৳{d.consultationFee}
                      </span>
                    )}
                  </div>
                  {d.hospitalName && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium">{d.hospitalName}</span>
                      {d.chamberAddress && ` · ${d.chamberAddress}`}
                    </p>
                  )}
                  {d.doctorFacilities.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-2">
                      {d.doctorFacilities.map((df) => (
                        <span
                          key={df.id}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                        >
                          {df.facility.name}
                        </span>
                      ))}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
              <Link
                href={buildQuery({ page: page > 1 ? String(page - 1) : undefined })}
                aria-disabled={page === 1}
                className={`rounded-2xl border border-slate-300 px-4 py-2 text-sm ${
                  page === 1 ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
                }`}
              >
                ← Previous
              </Link>
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <Link
                href={buildQuery({ page: page < totalPages ? String(page + 1) : undefined })}
                aria-disabled={page === totalPages}
                className={`rounded-2xl border border-slate-300 px-4 py-2 text-sm ${
                  page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-slate-50"
                }`}
              >
                Next →
              </Link>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </p>
      {children}
    </div>
  );
}
