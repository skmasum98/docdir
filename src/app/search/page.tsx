import Link from "next/link";
import { prisma, Prisma } from "@/lib/prisma";
import { DoctorStatus } from "@/lib/enums";
import { UserAvatar } from "@/components/user-avatar";
import {
  X,
  Filter,
  ChevronDown,
  Search,
  MapPin,
  Clock3,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";

export const metadata = {
  title: "Search Doctors | Doctor Directory Bangladesh",
  description:
    "Find verified specialist doctors in Bangladesh. Search by name, specialty, location, hospital, gender, and consultation fee. View chamber addresses, visiting hours, and book appointments.",
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

function getParam(
  val: string | string[] | undefined
): string | undefined {
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

  /* =========================================================
     QUERY PARAMETERS
  ========================================================= */

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

  const page = Math.max(
    1,
    Number(getParam(sp.page) ?? "1") || 1
  );

  /* =========================================================
     DOCTOR FILTER
  ========================================================= */

  const doctorWhere: Prisma.DoctorWhereInput = {
    status: DoctorStatus.PUBLISHED,
  };

  if (q) {
    doctorWhere.OR = [
      {
        fullName: {
          contains: q,
        },
      },
      {
        hospitalName: {
          contains: q,
        },
      },
      {
        chamberAddress: {
          contains: q,
        },
      },
      {
        about: {
          contains: q,
        },
      },
    ];
  }

  if (gender) {
    doctorWhere.gender =
      gender as "MALE" | "FEMALE" | "OTHER";
  }

  if (verified === "1") {
    doctorWhere.isVerified = true;
  }

  if (minFee || maxFee) {
    const fee: Prisma.IntNullableFilter = {};

    if (minFee && !isNaN(Number(minFee))) {
      fee.gte = Number(minFee);
    }

    if (maxFee && !isNaN(Number(maxFee))) {
      fee.lte = Number(maxFee);
    }

    doctorWhere.consultationFee = fee;
  }

  if (specialtySlug) {
    doctorWhere.specialty = {
      slug: specialtySlug,
    };
  }

  /* =========================================================
     FACILITY FILTER
  ========================================================= */

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

  /* =========================================================
     DATABASE QUERIES
  ========================================================= */

  const [
    divisions,
    specialties,
    total,
    doctors,
  ] = await Promise.all([
    prisma.division.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        districts: {
          orderBy: {
            name: "asc",
          },
        },
      },
    }),

    prisma.specialty.findMany({
      orderBy: {
        name: "asc",
      },
    }),

    prisma.doctor.count({
      where: doctorWhere,
    }),

    prisma.doctor.findMany({
      where: doctorWhere,
      orderBy: [
        {
          isVerified: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        specialty: {
          select: {
            name: true,
            slug: true,
          },
        },
        doctorFacilities: {
          include: {
            facility: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(total / PAGE_SIZE)
  );

  /* =========================================================
     CASCADING LOCATION DATA
     Resolve parent slugs even when a child slug is present
     without its parent (e.g. shared/bookmarked URLs).
  ========================================================= */

  // If district is selected without division, find its division first
  let effectiveDivisionSlug = divisionSlug;
  if (!effectiveDivisionSlug && districtSlug) {
    const parent = await prisma.district.findUnique({
      where: { slug: districtSlug },
      select: { division: { select: { slug: true } } },
    });
    effectiveDivisionSlug = parent?.division.slug;
  }

  // If upazila is selected without district, find its district + division
  let effectiveDistrictSlug = districtSlug;
  if (!effectiveDistrictSlug && upazilaSlug) {
    const parent = await prisma.upazila.findUnique({
      where: { slug: upazilaSlug },
      select: {
        slug: true,
        district: {
          select: {
            slug: true,
            division: { select: { slug: true } },
          },
        },
      },
    });
    effectiveDistrictSlug = parent?.district.slug;
    if (!effectiveDivisionSlug) {
      effectiveDivisionSlug = parent?.district.division.slug;
    }
  }

  // If facility is selected without upazila, find its upazila chain
  let effectiveUpazilaSlug = upazilaSlug;
  if (!effectiveUpazilaSlug && facilitySlug) {
    const parent = await prisma.facility.findUnique({
      where: { slug: facilitySlug },
      select: {
        upazila: {
          select: {
            slug: true,
            district: {
              select: {
                slug: true,
                division: { select: { slug: true } },
              },
            },
          },
        },
      },
    });
    effectiveUpazilaSlug = parent?.upazila?.slug;
    if (!effectiveDistrictSlug) {
      effectiveDistrictSlug = parent?.upazila?.district.slug;
    }
    if (!effectiveDivisionSlug) {
      effectiveDivisionSlug = parent?.upazila?.district.division.slug;
    }
  }

  const [districts, upazilas, facilities] = await Promise.all([
    effectiveDivisionSlug
      ? Promise.resolve(
          divisions.find((d) => d.slug === effectiveDivisionSlug)
            ?.districts ?? []
        )
      : Promise.resolve([]),

    effectiveDistrictSlug
      ? prisma.upazila.findMany({
          where: {
            district: {
              slug: effectiveDistrictSlug,
            },
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),

    effectiveUpazilaSlug
      ? prisma.facility.findMany({
          where: {
            upazila: {
              slug: effectiveUpazilaSlug,
            },
          },
          orderBy: {
            name: "asc",
          },
        })
      : Promise.resolve([]),
  ]);

  /* =========================================================
     QUERY BUILDER
  ========================================================= */

  function buildQuery(
    overrides: Record<string, string | undefined>
  ) {
    const params = new URLSearchParams();

    const current: Record<
      string,
      string | undefined
    > = {
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

    const merged = {
      ...current,
      ...overrides,
    };

    for (const [key, value] of Object.entries(
      merged
    )) {
      if (
        value !== undefined &&
        value !== ""
      ) {
        params.set(key, String(value));
      }
    }

    const queryString = params.toString();

    return queryString
      ? `/search?${queryString}`
      : "/search";
  }

  const hasActiveFilters = Boolean(
    q ||
      specialtySlug ||
      divisionSlug ||
      districtSlug ||
      upazilaSlug ||
      facilitySlug ||
      gender ||
      verified === "1" ||
      minFee ||
      maxFee
  );

  const clearFiltersQuery = buildQuery({
    q: undefined,
    specialty: undefined,
    division: undefined,
    district: undefined,
    upazila: undefined,
    facility: undefined,
    gender: undefined,
    verified: undefined,
    minFee: undefined,
    maxFee: undefined,
    page: undefined,
  });

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8 lg:px-6 lg:py-10">
      <div className="space-y-5 sm:space-y-6">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Find a doctor
          </h1>

          <p className="mt-1 text-sm text-slate-600">
            {total} doctor{total === 1 ? "" : "s"} found
            {q ? (
              <>
                {" "}
                for <span className="font-semibold text-slate-900">“{q}”</span>
              </>
            ) : (
              "."
            )}
          </p>
        </header>

        {/* =====================================================
            UNIFIED SEARCH BAR (visible on all screens)
            Preserves active filters so typing a query never
            wipes specialty / location / fee selections.
        ===================================================== */}

        <form
          action="/search"
          method="get"
          role="search"
          className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4"
        >
          {/* Preserve active filters */}
          {specialtySlug && (
            <input type="hidden" name="specialty" value={specialtySlug} />
          )}
          {divisionSlug && (
            <input type="hidden" name="division" value={divisionSlug} />
          )}
          {districtSlug && (
            <input type="hidden" name="district" value={districtSlug} />
          )}
          {upazilaSlug && (
            <input type="hidden" name="upazila" value={upazilaSlug} />
          )}
          {facilitySlug && (
            <input type="hidden" name="facility" value={facilitySlug} />
          )}
          {gender && <input type="hidden" name="gender" value={gender} />}
          {verified === "1" && (
            <input type="hidden" name="verified" value="1" />
          )}
          {minFee && <input type="hidden" name="minFee" value={minFee} />}
          {maxFee && <input type="hidden" name="maxFee" value={maxFee} />}

          <label
            htmlFor="doctor-search"
            className="mb-2 block text-sm font-semibold text-slate-800"
          >
            Search doctors
          </label>

          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                id="doctor-search"
                name="q"
                type="search"
                defaultValue={q ?? ""}
                placeholder="Doctor name, specialty, hospital, area..."
                autoComplete="off"
                className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-10 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
              />

              {q && (
                <Link
                  href={buildQuery({ q: undefined, page: undefined })}
                  aria-label="Clear search"
                  title="Clear search"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="h-12 flex-1 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99] sm:flex-none"
              >
                Search
              </button>

              {hasActiveFilters && (
                <Link
                  href="/search"
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Reset
                </Link>
              )}
            </div>
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Tip: select a specialty or location below to narrow results.
          </p>
        </form>

        {/* =====================================================
            MAIN LAYOUT
        ===================================================== */}

        <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-7">

          {/* ===================================================
              SIDEBAR / FILTERS
          =================================================== */}

          <aside className="min-w-0">

            {/* =================================================
                MOBILE FILTER
            ================================================= */}

            <details
              className="group rounded-2xl border border-slate-200 bg-white shadow-sm md:hidden"
              open={hasActiveFilters}
            >
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between px-4 py-3 font-semibold text-slate-900 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 text-slate-700" />

                  <span>Filters</span>

                  {hasActiveFilters && (
                    <span className="rounded-full bg-slate-950 px-2 py-0.5 text-[10px] font-semibold text-white">
                      Active
                    </span>
                  )}
                </span>

                <ChevronDown className="h-5 w-5 text-slate-400 transition-transform group-open:rotate-180" />
              </summary>

              <div className="border-t border-slate-100 p-4">
                <MobileFilterForm
                  q={q}
                  specialtySlug={specialtySlug}
                  divisionSlug={divisionSlug}
                  districtSlug={districtSlug}
                  upazilaSlug={upazilaSlug}
                  facilitySlug={facilitySlug}
                  gender={gender}
                  verified={verified}
                  minFee={minFee}
                  maxFee={maxFee}
                  specialties={specialties}
                  divisions={divisions}
                  districts={districts}
                  upazilas={upazilas}
                  facilities={facilities}
                />

                {hasActiveFilters && (
                  <Link
                    href={clearFiltersQuery}
                    className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <X className="h-4 w-4" />
                    Clear all filters
                  </Link>
                )}
              </div>
            </details>

            {/* =================================================
                DESKTOP FILTERS
            ================================================= */}

            <div className="hidden space-y-4 md:block lg:sticky lg:top-20 lg:self-start lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto lg:pr-1">

              {/* Specialty */}
              <FilterGroup title="Specialty">
                <ul className="max-h-60 space-y-1 overflow-y-auto pr-1">
                  <li>
                    <Link
                      href={buildQuery({
                        specialty: undefined,
                        page: undefined,
                      })}
                      className={`block rounded-xl px-3 py-2 text-sm transition ${
                        !specialtySlug
                          ? "bg-slate-100 font-semibold text-slate-900"
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      All specialties
                    </Link>
                  </li>

                  {specialties.map((s) => (
                    <li key={s.id}>
                      <Link
                        href={buildQuery({
                          specialty: s.slug,
                          page: undefined,
                        })}
                        className={`block rounded-xl px-3 py-2 text-sm transition ${
                          specialtySlug === s.slug
                            ? "bg-slate-100 font-semibold text-slate-900"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {s.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </FilterGroup>

              {/* Location + other filters */}
              <FilterGroup title="Filters">
                <form
                  id="desktop-search-filters"
                  action="/search"
                  method="get"
                  className="space-y-4 text-sm"
                >
                  {/* Visible search — previously desktop had no search box */}
                  <FilterField label="Search keyword">
                    <input
                      type="search"
                      name="q"
                      defaultValue={q ?? ""}
                      placeholder="Name, hospital, area..."
                      autoComplete="off"
                      className="filter-input"
                    />
                  </FilterField>

                  {specialtySlug && (
                    <input
                      type="hidden"
                      name="specialty"
                      value={specialtySlug}
                    />
                  )}

                  {/* Division */}
                  <FilterField
                    label="Division"
                    hint={
                      districts.length === 0
                        ? "Select a division to unlock districts."
                        : undefined
                    }
                  >
                    <select
                      name="division"
                      defaultValue={divisionSlug ?? ""}
                      className="filter-select"
                    >
                      <option value="">
                        All Divisions
                      </option>

                      {divisions.map((d) => (
                        <option
                          key={d.id}
                          value={d.slug}
                        >
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  {/* District — always visible, disabled until division chosen */}
                  <FilterField
                    label="District"
                    hint={
                      !divisionSlug
                        ? "Select a division first."
                        : districts.length === 0
                          ? "No districts in this division."
                          : undefined
                    }
                  >
                    <select
                      name="district"
                      defaultValue={districtSlug ?? ""}
                      disabled={!divisionSlug || districts.length === 0}
                      className="filter-select disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {divisionSlug ? "All Districts" : "Select division first"}
                      </option>

                      {districts.map((d) => (
                        <option
                          key={d.id}
                          value={d.slug}
                        >
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  {/* Upazila — always visible */}
                  <FilterField
                    label="Upazila / Thana"
                    hint={
                      !districtSlug
                        ? "Select a district first."
                        : upazilas.length === 0
                          ? "No upazilas in this district."
                          : undefined
                    }
                  >
                    <select
                      name="upazila"
                      defaultValue={upazilaSlug ?? ""}
                      disabled={!districtSlug || upazilas.length === 0}
                      className="filter-select disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {districtSlug ? "All Upazilas" : "Select district first"}
                      </option>

                      {upazilas.map((u) => (
                        <option
                          key={u.id}
                          value={u.slug}
                        >
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  {/* Facility — always visible */}
                  <FilterField
                    label="Hospital / Facility"
                    hint={
                      !upazilaSlug
                        ? "Select an upazila first."
                        : facilities.length === 0
                          ? "No facilities in this upazila."
                          : undefined
                    }
                  >
                    <select
                      name="facility"
                      defaultValue={facilitySlug ?? ""}
                      disabled={!upazilaSlug || facilities.length === 0}
                      className="filter-select disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    >
                      <option value="">
                        {upazilaSlug ? "All Facilities" : "Select upazila first"}
                      </option>

                      {facilities.map((f) => (
                        <option
                          key={f.id}
                          value={f.slug}
                        >
                          {f.name}
                        </option>
                      ))}
                    </select>
                  </FilterField>

                  {/* Gender */}
                  <FilterField label="Gender">
                    <select
                      name="gender"
                      defaultValue={gender ?? ""}
                      className="filter-select"
                    >
                      <option value="">Any</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </FilterField>

                  {/* Fee */}
                  <div>
                    <label className="mb-1.5 block font-medium text-slate-700">
                      Consultation fee
                    </label>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        name="minFee"
                        type="number"
                        min={0}
                        defaultValue={minFee ?? ""}
                        placeholder="Min ৳"
                        className="filter-input"
                      />

                      <input
                        name="maxFee"
                        type="number"
                        min={0}
                        defaultValue={maxFee ?? ""}
                        placeholder="Max ৳"
                        className="filter-input"
                      />
                    </div>
                  </div>

                  {/* Verified */}
                  <label className="flex cursor-pointer items-center gap-2 rounded-xl px-1 py-1 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="verified"
                      value="1"
                      defaultChecked={verified === "1"}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />

                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-600" />
                      Verified doctors only
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Apply filters
                  </button>
                </form>
              </FilterGroup>

              {/* Clear */}
              {hasActiveFilters && (
                <Link
                  href={clearFiltersQuery}
                  className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                >
                  <X className="h-4 w-4" />
                  Clear all filters
                </Link>
              )}
            </div>
          </aside>

          {/* ===================================================
              DOCTOR RESULTS
          =================================================== */}

          <section className="min-w-0">

            {/* Result summary */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Showing{" "}
                {doctors.length > 0
                  ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                      page * PAGE_SIZE,
                      total
                    )}`
                  : "0"}{" "}
                of {total} doctors
              </p>

              {hasActiveFilters && (
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600">
                  <Filter className="h-3 w-3" />
                  Filters applied
                </span>
              )}
            </div>

            {/* Active filter chips — one-tap remove */}
            {hasActiveFilters && (
              <div className="mb-4 flex flex-wrap gap-1.5">
                {q && (
                  <Link
                    href={buildQuery({ q: undefined, page: undefined })}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                  >
                    <Search className="h-3 w-3 shrink-0 text-slate-400" />
                    <span className="max-w-40 truncate">“{q}”</span>
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {specialtySlug && (
                  <Link
                    href={buildQuery({ specialty: undefined, page: undefined })}
                    className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-900 transition hover:bg-indigo-100"
                  >
                    <span className="max-w-40 truncate">
                      {specialties.find((s) => s.slug === specialtySlug)?.name ??
                        specialtySlug}
                    </span>
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {divisionSlug && (
                  <Link
                    href={buildQuery({
                      division: undefined,
                      district: undefined,
                      upazila: undefined,
                      facility: undefined,
                      page: undefined,
                    })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                    {divisions.find((d) => d.slug === divisionSlug)?.name ??
                      divisionSlug}
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {districtSlug && (
                  <Link
                    href={buildQuery({
                      district: undefined,
                      upazila: undefined,
                      facility: undefined,
                      page: undefined,
                    })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {districts.find((d) => d.slug === districtSlug)?.name ??
                      districtSlug}
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {upazilaSlug && (
                  <Link
                    href={buildQuery({
                      upazila: undefined,
                      facility: undefined,
                      page: undefined,
                    })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {upazilas.find((u) => u.slug === upazilaSlug)?.name ??
                      upazilaSlug}
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {facilitySlug && (
                  <Link
                    href={buildQuery({ facility: undefined, page: undefined })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {facilities.find((f) => f.slug === facilitySlug)?.name ??
                      facilitySlug}
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {gender && (
                  <Link
                    href={buildQuery({ gender: undefined, page: undefined })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    {gender.charAt(0) + gender.slice(1).toLowerCase()}
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {verified === "1" && (
                  <Link
                    href={buildQuery({ verified: undefined, page: undefined })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-800 transition hover:bg-emerald-100"
                  >
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    Verified
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                {(minFee || maxFee) && (
                  <Link
                    href={buildQuery({
                      minFee: undefined,
                      maxFee: undefined,
                      page: undefined,
                    })}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    ৳{minFee ?? "0"}–৳{maxFee ?? "∞"}
                    <X className="h-3 w-3 shrink-0" />
                  </Link>
                )}
                <Link
                  href={clearFiltersQuery}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
                >
                  Clear all
                </Link>
              </div>
            )}

            {/* No results */}
            {doctors.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <Search className="h-5 w-5 text-slate-400" />
                </div>

                <h2 className="mt-4 text-base font-semibold text-slate-900">
                  No doctors found
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  No doctors match your current search or filters.
                </p>

                {hasActiveFilters && (
                  <Link
                    href={clearFiltersQuery}
                    className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                    Clear filters
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3 sm:space-y-4">

                {doctors.map((d) => (
                  <Link
                    key={d.id}
                    href={`/doctor/${d.slug}`}
                    className="group block min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:rounded-3xl sm:p-5 lg:p-6"
                  >
                    {/* Main doctor row */}
                    <div className="flex min-w-0 items-start gap-3 sm:gap-4">

                      {/* Avatar */}
                      <UserAvatar
                        src={d.profilePhoto}
                        name={d.fullName}
                        size="lg"
                        className="shrink-0 shadow-sm ring-2 ring-slate-100"
                      />

                      {/* Doctor information */}
                      <div className="min-w-0 flex-1">

                        <div className="flex min-w-0 items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-base font-semibold leading-6 text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-lg">
                              {d.fullName}

                              {d.isVerified && (
                                <span className="ml-1.5 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 align-middle text-[10px] font-semibold text-emerald-700 sm:text-xs">
                                  <ShieldCheck className="h-3 w-3" />
                                  Verified
                                </span>
                              )}
                            </p>

                            {d.degrees && (
                              <p className="mt-1 break-words text-xs font-medium leading-5 text-indigo-900 sm:text-sm">
                                {d.degrees}
                              </p>
                            )}
                          </div>

                          {/* Desktop fee */}
                          {d.consultationFee !== null && (
                            <span className="hidden shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-800 sm:inline-flex">
                              ৳{d.consultationFee}
                            </span>
                          )}
                        </div>

                        {/* Designation / specialty */}
                        <p className="mt-1 break-words text-xs leading-5 text-slate-600 sm:text-sm">
                          {d.designation
                            ? `${d.designation} · `
                            : ""}
                          {d.specialty?.name ??
                            "General practitioner"}

                          {d.experienceYears !== null &&
                            ` · ${d.experienceYears} yrs exp.`}
                        </p>

                        {/* Mobile fee */}
                        {d.consultationFee !== null && (
                          <span className="mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 sm:hidden">
                            Consultation: ৳
                            {d.consultationFee}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Hospital / chamber information */}
                    {(d.hospitalName ||
                      d.chamberAddress ||
                      d.visitingHours) && (
                      <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600 sm:ml-[68px]">
                        {(d.hospitalName ||
                          d.chamberAddress) && (
                          <p className="flex items-start gap-1.5">
                            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

                            <span className="min-w-0 break-words">
                              {d.hospitalName && (
                                <span className="font-semibold text-slate-800">
                                  {d.hospitalName}
                                </span>
                              )}

                              {d.chamberAddress &&
                                ` · ${d.chamberAddress}`}
                            </span>
                          </p>
                        )}

                        {d.visitingHours && (
                          <p className="flex items-start gap-1.5 font-medium text-indigo-700">
                            <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                            <span className="break-words">
                              {d.visitingHours}
                            </span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* Facilities */}
                    {d.doctorFacilities.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5 sm:ml-[68px]">
                        {d.doctorFacilities.map((df) => (
                          <span
                            key={df.id}
                            className="max-w-full truncate rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-medium text-slate-700 sm:text-xs"
                          >
                            {df.facility.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            )}

            {/* =================================================
                PAGINATION
            ================================================= */}

            {totalPages > 1 && (
              <nav
                aria-label="Doctor search pagination"
                className="mt-5 flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:mt-6 sm:rounded-3xl sm:p-4"
              >
                <Link
                  href={buildQuery({
                    page:
                      page > 1
                        ? String(page - 1)
                        : undefined,
                  })}
                  aria-disabled={page === 1}
                  className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    page === 1
                      ? "pointer-events-none opacity-40"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="sm:hidden">
                    ← Prev
                  </span>

                  <span className="hidden sm:inline">
                    ← Previous
                  </span>
                </Link>

                <p className="shrink-0 text-xs font-medium text-slate-600 sm:text-sm">
                  Page {page} of {totalPages}
                </p>

                <Link
                  href={buildQuery({
                    page:
                      page < totalPages
                        ? String(page + 1)
                        : undefined,
                  })}
                  aria-disabled={page === totalPages}
                  className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
                    page === totalPages
                      ? "pointer-events-none opacity-40"
                      : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <span className="sm:hidden">
                    Next →
                  </span>

                  <span className="hidden sm:inline">
                    Next →
                  </span>
                </Link>
              </nav>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}

/* =============================================================
   MOBILE FILTER FORM
============================================================= */

function MobileFilterForm({
  q,
  specialtySlug,
  divisionSlug,
  districtSlug,
  upazilaSlug,
  facilitySlug,
  gender,
  verified,
  minFee,
  maxFee,
  specialties,
  divisions,
  districts,
  upazilas,
  facilities,
}: {
  q?: string;
  specialtySlug?: string;
  divisionSlug?: string;
  districtSlug?: string;
  upazilaSlug?: string;
  facilitySlug?: string;
  gender?: string;
  verified?: string;
  minFee?: string;
  maxFee?: string;
  specialties: Array<{
    id: string | number;
    name: string;
    slug: string;
  }>;
  divisions: Array<{
    id: string | number;
    name: string;
    slug: string;
  }>;
  districts: Array<{
    id: string | number;
    name: string;
    slug: string;
  }>;
  upazilas: Array<{
    id: string | number;
    name: string;
    slug: string;
  }>;
  facilities: Array<{
    id: string | number;
    name: string;
    slug: string;
  }>;
}) {
  return (
    <form
      action="/search"
      method="get"
      className="space-y-3"
    >
      {/* Search is editable inside filters too — not hidden */}
      <FilterField label="Search keyword">
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Name, hospital, area..."
          autoComplete="off"
          className="filter-input"
        />
      </FilterField>

      {/* Specialty */}
      <FilterField label="Specialty">
        <select
          name="specialty"
          defaultValue={specialtySlug ?? ""}
          className="filter-select"
        >
          <option value="">
            All Specialties
          </option>

          {specialties.map((s) => (
            <option
              key={s.id}
              value={s.slug}
            >
              {s.name}
            </option>
          ))}
        </select>
      </FilterField>

      {/* Division */}
      <FilterField
        label="Division"
        hint={
          districts.length === 0
            ? "Select a division to unlock districts."
            : undefined
        }
      >
        <select
          name="division"
          defaultValue={divisionSlug ?? ""}
          className="filter-select"
        >
          <option value="">
            All Divisions
          </option>

          {divisions.map((d) => (
            <option
              key={d.id}
              value={d.slug}
            >
              {d.name}
            </option>
          ))}
        </select>
      </FilterField>

      {/* District — always visible */}
      <FilterField
        label="District"
        hint={!divisionSlug ? "Select a division first." : undefined}
      >
        <select
          name="district"
          defaultValue={districtSlug ?? ""}
          disabled={!divisionSlug || districts.length === 0}
          className="filter-select disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">
            {divisionSlug ? "All Districts" : "Select division first"}
          </option>

          {districts.map((d) => (
            <option
              key={d.id}
              value={d.slug}
            >
              {d.name}
            </option>
          ))}
        </select>
      </FilterField>

      {/* Upazila — always visible */}
      <FilterField
        label="Upazila / Thana"
        hint={!districtSlug ? "Select a district first." : undefined}
      >
        <select
          name="upazila"
          defaultValue={upazilaSlug ?? ""}
          disabled={!districtSlug || upazilas.length === 0}
          className="filter-select disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">
            {districtSlug ? "All Upazilas" : "Select district first"}
          </option>

          {upazilas.map((u) => (
            <option
              key={u.id}
              value={u.slug}
            >
              {u.name}
            </option>
          ))}
        </select>
      </FilterField>

      {/* Facility — always visible */}
      <FilterField
        label="Hospital / Facility"
        hint={!upazilaSlug ? "Select an upazila first." : undefined}
      >
        <select
          name="facility"
          defaultValue={facilitySlug ?? ""}
          disabled={!upazilaSlug || facilities.length === 0}
          className="filter-select disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          <option value="">
            {upazilaSlug ? "All Facilities" : "Select upazila first"}
          </option>

          {facilities.map((f) => (
            <option
              key={f.id}
              value={f.slug}
            >
              {f.name}
            </option>
          ))}
        </select>
      </FilterField>

      {/* Gender */}
      <FilterField label="Gender">
        <select
          name="gender"
          defaultValue={gender ?? ""}
          className="filter-select"
        >
          <option value="">Any</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
        </select>
      </FilterField>

      {/* Fee */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Consultation fee
        </label>

        <div className="grid grid-cols-2 gap-2">
          <input
            name="minFee"
            type="number"
            min={0}
            defaultValue={minFee ?? ""}
            placeholder="Min ৳"
            className="filter-input"
          />

          <input
            name="maxFee"
            type="number"
            min={0}
            defaultValue={maxFee ?? ""}
            placeholder="Max ৳"
            className="filter-input"
          />
        </div>
      </div>

      {/* Verified */}
      <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 text-sm text-slate-700">
        <input
          type="checkbox"
          name="verified"
          value="1"
          defaultChecked={verified === "1"}
          className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
        />

        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Verified doctors only
        </span>
      </label>

      <button
        type="submit"
        className="min-h-11 w-full rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
      >
        Apply filters
      </button>
    </form>
  );
}

/* =============================================================
   FILTER GROUP
============================================================= */

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {title}
      </p>

      {children}
    </div>
  );
}

/* =============================================================
   FILTER FIELD
============================================================= */

function FilterField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>

      {children}

      {hint && (
        <p className="mt-1 text-xs text-slate-400">{hint}</p>
      )}
    </div>
  );
}
