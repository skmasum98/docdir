import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const [divisions, specialties, totalDoctors, totalFacilities, featured] = await Promise.all([
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
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <section className="rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-semibold text-slate-900">Find a doctor near you</h1>
        <p className="mt-3 max-w-2xl text-base text-slate-600">
          Search by specialty, hospital or location. Read verified reviews from real patients
          and book with confidence.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/search"
            className="rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Search doctors
          </Link>
          <Link
            href="/register"
            className="rounded-2xl border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
          >
            Create an account
          </Link>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Verified doctors" value={totalDoctors} />
        <Stat label="Specialties" value={specialties} />
        <Stat label="Facilities" value={totalFacilities} />
        <Stat label="Divisions" value={divisions} />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold text-slate-900">Featured doctors</h2>
        {featured.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No doctors yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((d) => (
              <Link
                key={d.id}
                href={`/doctor/${d.slug}`}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
              >
                <p className="text-lg font-semibold text-slate-900">{d.fullName}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {d.specialty?.name ?? "General"}{" "}
                  {d.consultationFee !== null && `· ৳${d.consultationFee}`}
                </p>
                {d.city && <p className="mt-1 text-xs text-slate-500">{d.city}</p>}
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}
