import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/user-avatar";
import {
  FlaskConical,
  Sparkles,
  Search,
  ArrowRight,
  MapPin,
} from "lucide-react";

export default async function HomePage() {
  const [
    divisions,
    specialties,
    totalDoctors,
    totalFacilities,
    featuredDoctors,
    featuredFacilities,
  ] = await Promise.all([
    prisma.division.count(),
    prisma.specialty.count(),
    prisma.doctor.count({
      where: { status: "PUBLISHED" },
    }),
    prisma.facility.count(),
    prisma.doctor.findMany({
      where: {
        status: "PUBLISHED",
        isVerified: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      include: {
        specialty: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.facility.findMany({
      take: 4,
      orderBy: {
        doctorFacilities: {
          _count: "desc",
        },
      },
      include: {
        upazila: {
          include: {
            district: true,
          },
        },
        _count: {
          select: {
            doctorFacilities: true,
            tests: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8 lg:px-6 lg:py-10">
      <div className="space-y-8 sm:space-y-10 lg:space-y-12">

        {/* ================= HERO ================= */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">
          <div className="max-w-4xl space-y-5 sm:space-y-6">

            {/* Badge */}
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-900 sm:px-3 sm:text-xs">
              <Sparkles className="h-3.5 w-3.5 shrink-0 text-teal-700" />
              <span className="truncate">
                Complete Healthcare & Diagnostic Directory in Bangladesh
              </span>
            </div>

            {/* Heading */}
            <h1 className="max-w-3xl text-2xl font-extrabold leading-[1.2] tracking-tight text-slate-900 sm:text-3xl lg:text-4xl xl:text-5xl">
              Find top doctors & diagnostic centers across Bangladesh
            </h1>

            {/* Description */}
            <p className="max-w-2xl text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
              Search verified specialist doctors, compare hospital diagnostic
              test prices, check patient prep guidelines, and book
              appointments with confidence.
            </p>

            {/* CTA */}
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:gap-3">
              <Link
                href="/search"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 sm:w-auto"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Search Doctors</span>
              </Link>

              <Link
                href="/facilities"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-teal-300 bg-teal-50 px-5 py-3 text-sm font-bold text-teal-900 shadow-sm transition hover:bg-teal-100 sm:w-auto"
              >
                <FlaskConical className="h-4 w-4 shrink-0 text-teal-700" />
                <span>Hospitals & Diagnostic Centers</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Stat
            label="Verified doctors"
            value={totalDoctors}
            href="/search"
          />

          <Stat
            label="Specialties"
            value={specialties}
            href="/search"
          />

          <Stat
            label="Hospitals & Centers"
            value={totalFacilities}
            href="/facilities"
            highlight
          />

          <Stat
            label="Divisions Covered"
            value={divisions}
            href="/facilities"
          />
        </section>

        {/* ================= FACILITIES ================= */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Hospitals & Diagnostic Centers
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                Accredited medical institutes with specialized departments &
                pathology test facilities.
              </p>
            </div>

            <Link
              href="/facilities"
              className="inline-flex shrink-0 items-center gap-1 self-start text-xs font-bold text-teal-800 transition hover:text-teal-950 sm:self-auto"
            >
              <span>Explore all ({totalFacilities})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {featuredFacilities.map((f) => (
              <Link
                key={f.id}
                href={`/facility/${f.slug}`}
                className="group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md sm:rounded-3xl sm:p-5"
              >
                <div className="min-w-0 space-y-2.5">

                  {/* Type + Doctors */}
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 max-w-[65%] items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      <FlaskConical className="h-3 w-3 shrink-0" />
                      <span className="truncate">{f.type}</span>
                    </span>

                    <span className="shrink-0 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                      {f._count.doctorFacilities} Doctors
                    </span>
                  </div>

                  {/* Facility name */}
                  <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-teal-700 sm:text-base">
                    {f.name}
                  </h3>

                  {/* Location */}
                  <p className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                    <span className="truncate">
                      {f.upazila?.name || "General"}
                      {f.upazila?.district?.name
                        ? `, ${f.upazila.district.name}`
                        : ""}
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] font-semibold text-teal-800 sm:text-xs">
                  <span className="truncate">View Tests & Doctors</span>

                  <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= DOCTORS ================= */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Featured Verified Doctors
            </h2>

            <Link
              href="/search"
              className="inline-flex items-center gap-1 self-start text-xs font-bold text-slate-700 transition hover:text-slate-900 sm:self-auto"
            >
              <span>View all doctors</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {featuredDoctors.length === 0 ? (
            <p className="text-sm text-slate-500">
              No doctors published yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {featuredDoctors.map((d) => (
                <Link
                  key={d.id}
                  href={`/doctor/${d.slug}`}
                  className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:gap-4 sm:rounded-3xl sm:p-5 lg:p-6"
                >
                  <UserAvatar
                    src={d.profilePhoto}
                    name={d.fullName}
                    size="lg"
                    className="shrink-0 shadow-sm ring-2 ring-slate-100"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-base lg:text-lg">
                      {d.fullName}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-600 sm:text-sm">
                      {d.specialty?.name ?? "General practitioner"}
                      {d.consultationFee !== null &&
                        ` · ৳${d.consultationFee}`}
                    </p>

                    {d.city && (
                      <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
                        {d.city}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

/* ================= STAT CARD ================= */

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`h-full rounded-2xl border p-4 shadow-sm transition sm:rounded-3xl sm:p-5 lg:p-6 ${
        highlight
          ? "border-teal-200 bg-teal-50/60 hover:bg-teal-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[10px]">
        {label}
      </p>

      <p
        className={`mt-1.5 text-2xl font-extrabold leading-none sm:mt-2 sm:text-3xl ${
          highlight ? "text-teal-950" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block min-w-0 rounded-2xl focus-visible:outline-none"
      >
        {content}
      </Link>
    );
  }

  return content;
}
