import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const facility = await prisma.facility.findUnique({ where: { slug } });
  return {
    title: facility ? `${facility.name} | Doctor Directory` : "Facility | Doctor Directory",
  };
}

export default async function FacilityPage({ params }: Props) {
  const { slug } = await params;
  const facility = await prisma.facility.findUnique({
    where: { slug },
    include: {
      upazila: { include: { district: { include: { division: true } } } },
      doctorFacilities: {
        include: {
          doctor: {
            include: { specialty: { select: { name: true, slug: true } } },
          },
        },
      },
    },
  });
  if (!facility) notFound();

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link href="/search" className="text-sm text-indigo-700 hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-semibold text-slate-900">{facility.name}</h1>
        <p className="mt-1 text-sm text-slate-600">
          {facility.type}
          {facility.upazila &&
            ` · ${facility.upazila.name}, ${facility.upazila.district.name}, ${facility.upazila.district.division.name}`}
        </p>
        {facility.address && (
          <p className="mt-3 text-sm text-slate-700">{facility.address}</p>
        )}
        {facility.phone && (
          <p className="mt-1 text-sm text-slate-700">{facility.phone}</p>
        )}
      </div>

      <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Doctors here</h2>
        {facility.doctorFacilities.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">No doctors linked yet.</p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {facility.doctorFacilities.map((df) => (
              <li key={df.id}>
                <Link
                  href={`/doctor/${df.doctor.slug}`}
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300"
                >
                  <p className="font-semibold text-slate-900">{df.doctor.fullName}</p>
                  <p className="text-xs text-slate-500">
                    {df.doctor.specialty?.name ?? "General"}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
