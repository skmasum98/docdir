import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/user-avatar";
import {
  Building2,
  Hospital,
  FlaskConical,
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  MapPin,
  UserCheck,
} from "lucide-react";

export default async function HomePage() {
  const [divisions, specialties, totalDoctors, totalFacilities, featuredDoctors, featuredFacilities] =
    await Promise.all([
      prisma.division.count(),
      prisma.specialty.count(),
      prisma.doctor.count({ where: { status: "PUBLISHED" } }),
      prisma.facility.count(),
      prisma.doctor.findMany({
        where: { status: "PUBLISHED", isVerified: true },
        orderBy: { createdAt: "desc" },
        take: 6,
        include: { specialty: { select: { name: true } } },
      }),
      prisma.facility.findMany({
        take: 4,
        orderBy: { doctorFacilities: { _count: "desc" } },
        include: {
          upazila: { include: { district: true } },
          _count: { select: { doctorFacilities: true, tests: true } },
        },
      }),
    ]);

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-10 space-y-10">
      {/* Hero Section */}
      <section className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm space-y-6">
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-900">
          <Sparkles className="h-3.5 w-3.5 text-teal-700" />
          <span>Complete Healthcare & Diagnostic Directory</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight max-w-3xl">
          Find top doctors & diagnostic centers across Bangladesh
        </h1>
        <p className="max-w-2xl text-base text-slate-600 leading-relaxed">
          Search verified specialist doctors, compare hospital diagnostic test prices, check patient prep guidelines, and book appointments with confidence.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <Link
            href="/search"
            className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 transition shadow-xs flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            <span>Search Doctors</span>
          </Link>
          <Link
            href="/facilities"
            className="rounded-2xl border border-teal-300 bg-teal-50/80 px-6 py-3 text-sm font-bold text-teal-900 hover:bg-teal-100 transition shadow-2xs flex items-center gap-2"
          >
            <FlaskConical className="h-4 w-4 text-teal-700" />
            <span>Hospitals & Diagnostic Directory</span>
          </Link>
        </div>
      </section>

      {/* Stats Counter */}
      <section className="grid gap-4 sm:grid-cols-4">
        <Stat label="Verified doctors" value={totalDoctors} href="/search" />
        <Stat label="Specialties" value={specialties} href="/search" />
        <Stat label="Hospitals & Centers" value={totalFacilities} href="/facilities" highlight />
        <Stat label="Divisions Covered" value={divisions} href="/facilities" />
      </section>

      {/* Featured Hospitals & Diagnostics Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">
              Hospitals & Diagnostic Centers
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Accredited medical institutes with specialized departments & pathology test facilities.
            </p>
          </div>
          <Link
            href="/facilities"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950 transition"
          >
            <span>Explore all ({totalFacilities})</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredFacilities.map((f) => (
            <Link
              key={f.id}
              href={`/facility/${f.slug}`}
              className="group flex flex-col justify-between rounded-3xl border border-slate-200 bg-white p-5 shadow-sm hover:border-teal-300 hover:shadow-md transition space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800 border border-teal-200">
                    <FlaskConical className="h-3 w-3" />
                    {f.type}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">
                    {f._count.doctorFacilities} Doctors
                  </span>
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-teal-700 transition line-clamp-1">
                  {f.name}
                </h3>
                <p className="flex items-center gap-1 text-xs text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">
                    {f.upazila?.name || "General"}
                    {f.upazila?.district?.name ? `, ${f.upazila.district.name}` : ""}
                  </span>
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-teal-800 font-semibold">
                <span>View Tests & Doctors</span>
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Doctors Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Featured Verified Doctors</h2>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
          >
            <span>View all doctors</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {featuredDoctors.length === 0 ? (
          <p className="text-sm text-slate-500">No doctors published yet.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featuredDoctors.map((d) => (
              <Link
                key={d.id}
                href={`/doctor/${d.slug}`}
                className="group flex items-start gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300 hover:shadow-md"
              >
                <UserAvatar
                  src={d.profilePhoto}
                  name={d.fullName}
                  size="lg"
                  className="ring-2 ring-slate-100 shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                    {d.fullName}
                  </p>
                  <p className="mt-1 text-sm text-slate-600 truncate">
                    {d.specialty?.name ?? "General practitioner"}{" "}
                    {d.consultationFee !== null && `· ৳${d.consultationFee}`}
                  </p>
                  {d.city && <p className="mt-1 text-xs text-slate-500">{d.city}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

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
      className={`rounded-3xl border p-6 shadow-sm transition ${
        highlight
          ? "border-teal-200 bg-teal-50/50 hover:bg-teal-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`mt-2 text-3xl font-extrabold ${
          highlight ? "text-teal-950" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

