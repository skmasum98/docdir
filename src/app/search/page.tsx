import Link from "next/link";
import { prisma, Prisma } from "@/lib/prisma";
import { DoctorStatus } from "@/lib/enums";
import { UserAvatar } from "@/components/user-avatar";
import { X, Filter, ChevronDown } from "lucide-react";

export const metadata = { 
  title: "Search Doctors | Doctor Directory Bangladesh",
  description: "Find verified specialist doctors in Bangladesh. Search by name, specialty, location, hospital, gender, and consultation fee. View chamber addresses, visiting hours, and book appointments.",
};

type Props = {
  searchParams: Promise<{
    q?: string | string[];
    division?: string | string[];
    district?: string | string[];
    upazila?: string | string[];
    specialty?: string | string[];
    facility?: string | string[];
    gender?: string | string[];
    verified?: string | string[];
    minFee?: string | string[];
    maxFee?: string | string[];
    page?: string | string[];
  }>;
};

const PAGE_SIZE = 12;

function getParam(val: string | string[] | undefined): string | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) {
    const last = val[val.length - 1];
    return last ? last.trim() || undefined : undefined;
  }
  const trimmed = val.trim();
  return trimmed || undefined;
}

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;

  const q = getParam(sp.q);
  const divisionSlug = getParam(sp.division);
  const districtSlug = getParam(sp.district);
  const upazilaSlug = getParam(sp.upazila);
  const specialtySlug = getParam(sp.specialty);
  const facilitySlug = getParam(sp.facility);
  const gender = getParam(sp.gender);
  const verified = getParam(sp.verified);
  const minFee = getParam(sp.minFee);
  const maxFee = getParam(sp.maxFee);
  const page = Math.max(1, Number(getParam(sp.page) ?? "1") || 1);

  const doctorWhere: Prisma.DoctorWhereInput = { status: DoctorStatus.PUBLISHED };

  if (q) {
    doctorWhere.OR = [
      { fullName: { contains: q } },
      { hospitalName: { contains: q } },
      { chamberAddress: { contains: q } },
      { about: { contains: q } },
    ];
  }
  if (gender) {
    doctorWhere.gender = gender as "MALE" | "FEMALE" | "OTHER";
  }
  if (verified === "1") {
    doctorWhere.isVerified = true;
  }
  if (minFee || maxFee) {
    const fee: Prisma.IntNullableFilter = {};
    if (minFee && !isNaN(Number(minFee))) fee.gte = Number(minFee);
    if (maxFee && !isNaN(Number(maxFee))) fee.lte = Number(maxFee);
    doctorWhere.consultationFee = fee;
  }
  if (specialtySlug) {
    doctorWhere.specialty = { slug: specialtySlug };
  }

  const facilityWhere: Prisma.FacilityWhereInput = {};
  if (facilitySlug) {
    facilityWhere.slug = facilitySlug;
  }
  if (upazilaSlug) {
    facilityWhere.upazila = {
      ...(facilityWhere.upazila as object),
      slug: upazilaSlug,
    };
  }
  if (districtSlug) {
    facilityWhere.upazila = {
      ...(facilityWhere.upazila as object),
      district: {
        slug: districtSlug,
      },
    };
  }
  if (divisionSlug) {
    facilityWhere.upazila = {
      ...(facilityWhere.upazila as object),
      district: {
        ...((facilityWhere.upazila as any)?.district as object),
        division: {
          slug: divisionSlug,
        },
      },
    };
  }

  if (Object.keys(facilityWhere).length > 0) {
    doctorWhere.doctorFacilities = {
      some: {
        facility: facilityWhere,
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
    divisionSlug
      ? Promise.resolve(divisions.find((d) => d.slug === divisionSlug)?.districts ?? [])
      : Promise.resolve([]),
    districtSlug
      ? prisma.upazila.findMany({
          where: { district: { slug: districtSlug } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
    upazilaSlug
      ? prisma.facility.findMany({
          where: { upazila: { slug: upazilaSlug } },
          orderBy: { name: "asc" },
        })
      : Promise.resolve([]),
  ]);

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      q,
      specialty: specialtySlug,
      division: divisionSlug,
      district: districtSlug,
      upazila: upazilaSlug,
      facility: facilitySlug,
      gender,
      verified,
      minFee,
      maxFee,
      page: page > 1 ? String(page) : undefined,
    };
    const merged = { ...current, ...overrides };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== "") params.set(k, String(v));
    }
    return `/search?${params.toString()}`;
  }

  const hasActiveFilters = q || specialtySlug || divisionSlug || districtSlug || upazilaSlug || facilitySlug || gender || verified === "1" || minFee || maxFee;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900">Find a doctor</h1>
        <p className="mt-1 text-sm text-slate-600">
          {total} doctor{total === 1 ? "" : "s"} found.
        </p>
      </div>

      {/* Mobile Search Bar */}
      <form className="mb-4 md:hidden flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm" role="search">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Search</label>
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="Doctor name, hospital, area..."
            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none"
          />
        </div>
        <button className="rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
          Search
        </button>
      </form>

      <div className="mt-4 md:mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside className="space-y-4">
          {/* Mobile Filter Toggle - CSS only using peer */}
          <details className="md:hidden w-full rounded-2xl border border-slate-200 bg-white shadow-sm group">
            <summary className="flex items-center justify-between px-4 py-3 font-semibold text-slate-900 hover:bg-slate-50 transition cursor-pointer list-none">
              <span className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
                {hasActiveFilters && (
                  <span className="rounded-full bg-slate-950 px-2 py-0.5 text-xs text-white">
                    Active
                  </span>
                )}
              </span>
              <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
            </summary>
          </details>

          {/* Filters Panel - Hidden on mobile by default, visible on desktop */}
          <div className="hidden md:block space-y-4">
            <FilterGroup title="Specialty">
              <ul className="space-y-1 max-h-60 overflow-y-auto pr-1">
                <li>
                  <Link
                    href={buildQuery({ specialty: undefined, page: undefined })}
                    className={`block rounded-xl px-3 py-1.5 text-sm ${
                      !specialtySlug ? "bg-slate-100 font-semibold" : "hover:bg-slate-50"
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
                        specialtySlug === s.slug
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
                defaultValue={divisionSlug ?? ""}
                className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                form="search-filters"
              >
                <option value="">All Divisions</option>
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
                {q && <input type="hidden" name="q" value={q} />}
                {specialtySlug && <input type="hidden" name="specialty" value={specialtySlug} />}

                {districts.length > 0 && (
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">District</label>
                    <select
                      name="district"
                      defaultValue={districtSlug ?? ""}
                      className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="">All Districts</option>
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
                    <label className="mb-1 block font-medium text-slate-700">Upazila / Thana</label>
                    <select
                      name="upazila"
                      defaultValue={upazilaSlug ?? ""}
                      className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="">All Upazilas</option>
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
                    <label className="mb-1 block font-medium text-slate-700">Hospital / Facility</label>
                    <select
                      name="facility"
                      defaultValue={facilitySlug ?? ""}
                      className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                    >
                      <option value="">All Facilities</option>
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
                    defaultValue={gender ?? ""}
                    className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                  >
                    <option value="">Any</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">Min fee (৳)</label>
                    <input
                      name="minFee"
                      type="number"
                      min={0}
                      defaultValue={minFee ?? ""}
                      className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block font-medium text-slate-700">Max fee (৳)</label>
                    <input
                      name="maxFee"
                      type="number"
                      min={0}
                      defaultValue={maxFee ?? ""}
                      className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="verified"
                    value="1"
                    defaultChecked={verified === "1"}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Verified only</span>
                </label>

                <button className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800">
                  Apply filters
                </button>
              </form>
            </FilterGroup>

            {hasActiveFilters && (
              <Link
                href={buildQuery({ 
                  specialty: undefined, 
                  division: undefined, 
                  district: undefined, 
                  upazila: undefined, 
                  facility: undefined,
                  gender: undefined,
                  verified: undefined,
                  minFee: undefined,
                  maxFee: undefined,
                  q: undefined,
                  page: undefined
                })}
                className="w-full flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-100 transition"
              >
                <X className="h-4 w-4" />
                Clear all filters
              </Link>
            )}
          </div>
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
                  className="block rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition hover:border-slate-300"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3 sm:gap-4 w-full">
                      <UserAvatar
                        src={d.profilePhoto}
                        name={d.fullName}
                        size="lg"
                        className="ring-2 ring-slate-100 shadow-xs flex-shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-base sm:text-lg font-semibold text-slate-900">
                          {d.fullName}
                          {d.isVerified && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-800 font-normal">
                              ✓ Verified
                            </span>
                          )}
                        </p>
                        {d.degrees && (
                          <p className="mt-1 text-xs font-medium text-indigo-900/90 truncate">{d.degrees}</p>
                        )}
                        <p className="mt-1 text-sm text-slate-600 truncate">
                          {d.designation ? `${d.designation} · ` : ""}
                          {d.specialty?.name ?? "General practitioner"}{" "}
                          {d.experienceYears !== null && `· ${d.experienceYears} yrs exp.`}
                        </p>
                      </div>
                    </div>
                    {d.consultationFee !== null && (
                      <span className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-semibold flex-shrink-0">
                        ৳{d.consultationFee}
                      </span>
                    )}
                  </div>
                  {(d.hospitalName || d.chamberAddress || d.visitingHours) && (
                    <div className="mt-3 text-xs text-slate-600 pl-0 sm:pl-18 space-y-1">
                      {(d.hospitalName || d.chamberAddress) && (
                        <p>
                          <span className="font-semibold text-slate-800">{d.hospitalName}</span>
                          {d.chamberAddress && ` · ${d.chamberAddress}`}
                        </p>
                      )}
                      {d.visitingHours && (
                        <p className="text-indigo-700 font-medium">🕒 {d.visitingHours}</p>
                      )}
                    </div>
                  )}
                  {d.doctorFacilities.length > 0 && (
                    <p className="mt-2 flex flex-wrap gap-2 pl-0 sm:pl-20">
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
