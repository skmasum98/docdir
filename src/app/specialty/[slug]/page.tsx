import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma, Prisma } from "@/lib/prisma";
import { DoctorStatus } from "@/lib/enums";
import { UserAvatar } from "@/components/user-avatar";
import {
  Search,
  MapPin,
  Clock3,
  ShieldCheck,
  ChevronRight,
  Stethoscope,
  CalendarCheck,
  X,
} from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    q?: string | string[];
    division?: string | string[];
    page?: string | string[];
  }>;
};

// Prerender specialty pages + refresh hourly (edits revalidate on demand).
export const revalidate = 3600;

export async function generateStaticParams() {
  const specialties = await prisma.specialty.findMany({
    select: { slug: true },
  });
  return specialties.map((s) => ({ slug: s.slug }));
}

function getParam(val: string | string[] | undefined): string | undefined {
  if (!val) return undefined;
  if (Array.isArray(val)) {
    const last = val[val.length - 1];
    return last ? last.trim() || undefined : undefined;
  }
  const trimmed = val.trim();
  return trimmed || undefined;
}

const PAGE_SIZE = 12;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const specialty = await prisma.specialty.findUnique({
    where: { slug },
    select: { name: true, slug: true },
  });
  if (!specialty) {
    return { title: "Specialty Not Found | Doctor Directory" };
  }

  const siteUrl = process.env.NEXTAUTH_URL || "https://drchamber.info";
  const pageUrl = `${siteUrl}/specialty/${specialty.slug}`;
  const title = `${specialty.name} Doctors in Bangladesh | Doctor Directory`;
  const description =
    `Find verified ${specialty.name} specialists across Bangladesh. Compare consultation fees, chamber addresses, visiting hours and book serials online.`.slice(
      0,
      160
    );

  return {
    title,
    description,
    keywords: [
      `${specialty.name} doctor Bangladesh`,
      `${specialty.name} specialist Dhaka`,
      `best ${specialty.name} doctor`,
      `${specialty.name} consultation fee`,
      `${specialty.name} chamber address`,
    ],
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Doctor Directory",
      type: "website",
      locale: "en_BD",
    },
    twitter: { card: "summary", title, description },
  };
}

export default async function SpecialtyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const q = getParam(sp.q);
  const divisionSlug = getParam(sp.division);
  const page = Math.max(1, Number(getParam(sp.page) ?? "1") || 1);

  const specialty = await prisma.specialty.findUnique({
    where: { slug },
    select: { id: true, name: true, slug: true },
  });
  if (!specialty) notFound();
  const specialtySlug = specialty.slug;

  const doctorWhere: Prisma.DoctorWhereInput = {
    status: DoctorStatus.PUBLISHED,
    specialtyId: specialty.id,
  };

  if (q) {
    doctorWhere.OR = [
      { fullName: { contains: q } },
      { hospitalName: { contains: q } },
      { chamberAddress: { contains: q } },
      { about: { contains: q } },
    ];
  }

  if (divisionSlug) {
    doctorWhere.doctorFacilities = {
      some: {
        facility: {
          upazila: {
            district: {
              division: { slug: divisionSlug },
            },
          },
        },
      },
    };
  }

  const [divisions, total, doctors, otherSpecialties] = await Promise.all([
    prisma.division.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.doctor.count({ where: doctorWhere }),
    prisma.doctor.findMany({
      where: doctorWhere,
      orderBy: [{ isVerified: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        fullName: true,
        slug: true,
        degrees: true,
        designation: true,
        profilePhoto: true,
        consultationFee: true,
        visitingHours: true,
        isVerified: true,
        experienceYears: true,
        hospitalName: true,
        chamberAddress: true,
      },
    }),
    prisma.specialty.findMany({
      where: { id: { not: specialty.id } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  function buildQuery(overrides: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const current: Record<string, string | undefined> = {
      q,
      division: divisionSlug,
      page: page > 1 ? String(page) : undefined,
    };
    const merged = { ...current, ...overrides };
    for (const [key, value] of Object.entries(merged)) {
      if (value !== undefined && value !== "") params.set(key, String(value));
    }
    const qs = params.toString();
    return qs ? `/specialty/${specialtySlug}?${qs}` : `/specialty/${specialtySlug}`;
  }

  const hasActiveFilters = Boolean(q || divisionSlug);
  const siteUrl = process.env.NEXTAUTH_URL || "https://drchamber.info";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${siteUrl}/` },
      { "@type": "ListItem", position: 2, name: "Find Doctors", item: `${siteUrl}/search` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${specialty.name} Doctors`,
        item: `${siteUrl}/specialty/${specialty.slug}`,
      },
    ],
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${specialty.name} Doctors in Bangladesh`,
    itemListElement: doctors.map((d, i) => ({
      "@type": "ListItem",
      position: (page - 1) * PAGE_SIZE + i + 1,
      item: {
        "@type": "Physician",
        name: d.fullName,
        url: `${siteUrl}/doctor/${d.slug}`,
        medicalSpecialty: specialty.name,
      },
    })),
  };

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 px-3 py-5 sm:px-6 sm:py-8 space-y-5 sm:space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 text-xs text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition hover:text-slate-900">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        <Link href="/search" className="transition hover:text-slate-900">
          Find Doctors
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="max-w-[200px] truncate font-medium text-slate-900 sm:max-w-none">
          {specialty.name}
        </span>
      </nav>

      {/* Header */}
      <header>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-[11px] font-bold text-indigo-900">
          <Stethoscope className="h-3.5 w-3.5" />
          Medical Specialty
        </p>
        <h1 className="mt-2 max-w-3xl break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {specialty.name} Doctors in Bangladesh
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          {total} verified {specialty.name.toLowerCase()} specialist
          {total === 1 ? "" : "s"} found. Compare fees, chamber addresses and
          visiting hours, then book your serial online.
        </p>
      </header>

      {/* Search + division filter */}
      <form
        action={`/specialty/${specialty.slug}`}
        method="get"
        role="search"
        className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id={`specialty-search-${specialty.slug}`}
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder={`Search ${specialty.name} doctors, hospitals...`}
              autoComplete="off"
              className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <select
            name="division"
            defaultValue={divisionSlug ?? ""}
            aria-label="Filter by division"
            className="filter-select h-12 sm:w-52"
          >
            <option value="">All Divisions</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="h-12 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white transition hover:bg-slate-800 active:scale-[0.99]"
          >
            Search
          </button>
        </div>
      </form>

      {/* Result summary */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 sm:text-sm">
          Showing{" "}
          {doctors.length > 0
            ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, total)}`
            : "0"}{" "}
          of {total} doctors
        </p>
        {hasActiveFilters && (
          <Link
            href={`/specialty/${specialty.slug}`}
            className="inline-flex min-h-9 items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            <X className="h-3 w-3" />
            Clear filters
          </Link>
        )}
      </div>

      {/* Doctor list */}
      {doctors.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Search className="h-5 w-5 text-slate-400" />
          </div>
          <h2 className="mt-4 text-base font-semibold text-slate-900">
            No {specialty.name} doctors found
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Try a different keyword or division — or browse all doctors.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            {hasActiveFilters && (
              <Link
                href={`/specialty/${specialty.slug}`}
                className="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Clear filters
              </Link>
            )}
            <Link
              href="/search"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Browse all doctors
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {doctors.map((d, i) => (
            <article
              key={d.id}
              style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
              className="group block min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md animate-card-enter sm:rounded-3xl sm:p-5"
            >
              <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                <Link
                  href={`/doctor/${d.slug}`}
                  aria-label={`View ${d.fullName}'s profile`}
                  className="shrink-0 rounded-full transition-transform duration-200 hover:scale-105"
                >
                  <UserAvatar
                    src={d.profilePhoto}
                    name={d.fullName}
                    size="lg"
                    className="shadow-sm ring-2 ring-slate-100 transition group-hover:ring-indigo-200"
                  />
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <p className="min-w-0 break-words text-base font-semibold leading-6 text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-lg">
                      <Link href={`/doctor/${d.slug}`}>{d.fullName}</Link>
                      {d.isVerified && (
                        <span className="ml-1.5 inline-flex translate-y-[-1px] items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 align-middle text-[10px] font-semibold text-emerald-700 sm:text-xs">
                          <ShieldCheck className="h-3 w-3" />
                          Verified
                        </span>
                      )}
                    </p>
                    {d.consultationFee !== null && (
                      <span className="hidden shrink-0 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm font-bold text-slate-800 sm:inline-flex">
                        ৳{d.consultationFee}
                      </span>
                    )}
                  </div>
                  {d.degrees && (
                    <p className="mt-1 break-words text-xs font-medium leading-5 text-indigo-900 sm:text-sm">
                      {d.degrees}
                    </p>
                  )}
                  <p className="mt-1 break-words text-xs leading-5 text-slate-600 sm:text-sm">
                    {d.designation ? `${d.designation} · ` : ""}
                    {specialty.name}
                    {d.experienceYears !== null && ` · ${d.experienceYears} yrs exp.`}
                  </p>
                  {d.consultationFee !== null && (
                    <span className="mt-2 inline-flex rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-bold text-slate-800 sm:hidden">
                      Consultation: ৳{d.consultationFee}
                    </span>
                  )}
                </div>
              </div>

              {(d.hospitalName || d.chamberAddress || d.visitingHours) && (
                <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-600 sm:ml-[68px]">
                  {(d.hospitalName || d.chamberAddress) && (
                    <p className="flex items-start gap-1.5">
                      <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                      <span className="min-w-0 break-words">
                        {d.hospitalName && (
                          <span className="font-semibold text-slate-800">{d.hospitalName}</span>
                        )}
                        {d.chamberAddress && ` · ${d.chamberAddress}`}
                      </span>
                    </p>
                  )}
                  {d.visitingHours && (
                    <p className="flex items-start gap-1.5 font-medium text-indigo-700">
                      <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                      <span className="break-words">{d.visitingHours}</span>
                    </p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 sm:ml-[68px] sm:flex-row">
                <Link
                  href={`/doctor/${d.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl border border-slate-300 px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] sm:text-sm"
                >
                  View Profile
                </Link>
                <Link
                  href={`/doctor/${d.slug}`}
                  className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-4 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-[0.98] sm:text-sm"
                >
                  <CalendarCheck className="h-4 w-4 shrink-0" />
                  Book Serial
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav
          aria-label={`${specialty.name} doctors pagination`}
          className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:rounded-3xl sm:p-4"
        >
          <Link
            href={buildQuery({ page: page > 1 ? String(page - 1) : undefined })}
            aria-disabled={page === 1}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              page === 1
                ? "pointer-events-none opacity-40"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            ← Previous
          </Link>
          <p className="shrink-0 text-xs font-medium text-slate-600 sm:text-sm">
            Page {page} of {totalPages}
          </p>
          <Link
            href={buildQuery({ page: page < totalPages ? String(page + 1) : undefined })}
            aria-disabled={page === totalPages}
            className={`inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-semibold transition sm:px-4 sm:text-sm ${
              page === totalPages
                ? "pointer-events-none opacity-40"
                : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            Next →
          </Link>
        </nav>
      )}

      {/* Other specialties — internal linking */}
      {otherSpecialties.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            Browse other specialties
          </h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {otherSpecialties.map((s) => (
              <Link
                key={s.id}
                href={`/specialty/${s.slug}`}
                className="inline-flex min-h-9 items-center rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-200 hover:text-slate-900"
              >
                {s.name}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
