import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ReviewForm from "./review-form";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const doctor = await prisma.doctor.findUnique({ where: { slug } });
  return {
    title: doctor ? `${doctor.fullName} | Doctor Directory` : "Doctor | Doctor Directory",
  };
}

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const doctor = await prisma.doctor.findUnique({
    where: { slug },
    include: {
      specialty: true,
      doctorFacilities: {
        include: {
          facility: { include: { upazila: { include: { district: { include: { division: true } } } } } },
        },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true } } },
      },
    },
  });
  if (!doctor || doctor.status === "BLOCKED") notFound();

  const avg =
    doctor.reviews.length > 0
      ? doctor.reviews.reduce((s, r) => s + r.rating, 0) / doctor.reviews.length
      : null;

  const isOwnProfile =
    session?.user &&
    doctor.userId !== null &&
    Number(session.user.id) === doctor.userId;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link href="/search" className="text-sm text-indigo-700 hover:underline">
        ← Back to search
      </Link>

      <div className="mt-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900">{doctor.fullName}</h1>
            <p className="mt-1 text-sm text-slate-600">
              {doctor.specialty?.name ?? "General practitioner"}
              {doctor.experienceYears !== null && ` · ${doctor.experienceYears} years experience`}
              {doctor.gender && ` · ${doctor.gender}`}
            </p>
            <div className="mt-3 flex items-center gap-2">
              {doctor.isVerified ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
                  ✓ Verified
                </span>
              ) : (
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  Unverified
                </span>
              )}
              {doctor.profileClaimed && (
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-800">
                  Claimed
                </span>
              )}
            </div>
          </div>
          {doctor.consultationFee !== null && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Consultation fee</p>
              <p className="text-2xl font-semibold text-slate-900">৳{doctor.consultationFee}</p>
            </div>
          )}
        </div>

        {avg !== null && (
          <p className="mt-3 text-sm">
            <span className="font-semibold text-amber-600">
              {"★".repeat(Math.round(avg))}
            </span>{" "}
            <span className="text-slate-600">
              {avg.toFixed(1)} from {doctor.reviews.length} review
              {doctor.reviews.length === 1 ? "" : "s"}
            </span>
          </p>
        )}

        {!doctor.profileClaimed && !isOwnProfile && (
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Are you {doctor.fullName}?{" "}
            <Link
              href={`/dashboard/claim?doctorId=${doctor.id}`}
              className="font-semibold text-amber-900 underline"
            >
              Claim this profile
            </Link>
            .
          </div>
        )}

        {isOwnProfile && (
          <div className="mt-4">
            <Link
              href="/dashboard"
              className="inline-flex rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit profile
            </Link>
          </div>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Contact</h2>
          <dl className="mt-3 space-y-2 text-sm text-slate-700">
            {doctor.phone && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Phone</dt>
                <dd>{doctor.phone}</dd>
              </div>
            )}
            {doctor.email && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Email</dt>
                <dd>{doctor.email}</dd>
              </div>
            )}
            {doctor.website && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Website</dt>
                <dd>
                  <a
                    href={doctor.website}
                    className="text-indigo-700 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {doctor.website}
                  </a>
                </dd>
              </div>
            )}
            {doctor.hospitalName && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Hospital</dt>
                <dd>{doctor.hospitalName}</dd>
              </div>
            )}
            {doctor.chamberAddress && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Chamber</dt>
                <dd>{doctor.chamberAddress}</dd>
              </div>
            )}
            {(doctor.city || doctor.area) && (
              <div>
                <dt className="text-xs uppercase tracking-wide text-slate-500">Location</dt>
                <dd>
                  {[doctor.area, doctor.city].filter(Boolean).join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {doctor.about && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">About</h2>
            <p className="mt-3 whitespace-pre-line text-sm text-slate-700">{doctor.about}</p>
          </div>
        )}
      </div>

      {doctor.doctorFacilities.length > 0 && (
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Practices at</h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {doctor.doctorFacilities.map((df) => (
              <li key={df.id} className="rounded-2xl border border-slate-200 p-4 text-sm">
                <Link
                  href={`/facility/${df.facility.slug}`}
                  className="font-semibold text-slate-900 hover:underline"
                >
                  {df.facility.name}
                </Link>
                <p className="text-xs text-slate-500">
                  {df.facility.type}
                  {df.facility.upazila &&
                    ` · ${df.facility.upazila.name}, ${df.facility.upazila.district.name}, ${df.facility.upazila.district.division.name}`}
                </p>
                {df.facility.address && (
                  <p className="mt-1 text-xs text-slate-600">{df.facility.address}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900">Reviews</h2>
          {doctor.reviews.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-sm text-slate-500 shadow-sm">
              No reviews yet.
            </div>
          ) : (
            doctor.reviews.map((r) => (
              <div
                key={r.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <p className="font-semibold text-slate-900">{r.user.name}</p>
                <p className="mt-1 text-amber-600">{"★".repeat(r.rating)}</p>
                {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
                <p className="mt-2 text-xs text-slate-500">
                  {r.createdAt.toLocaleDateString()}
                </p>
              </div>
            ))
          )}
        </div>

        <ReviewForm
          doctorId={doctor.id}
          loggedIn={Boolean(session?.user) && !isOwnProfile}
        />
      </div>
    </main>
  );
}
