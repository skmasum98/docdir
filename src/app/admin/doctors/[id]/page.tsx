import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import DoctorEditForm from "./doctor-edit-form";
import { deleteDoctorAction } from "@/lib/actions/admin";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditDoctorPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const doctorId = Number(id);
  if (!Number.isFinite(doctorId)) notFound();

  const [doctor, specialties, facilities] = await Promise.all([
    prisma.doctor.findUnique({
      where: { id: doctorId },
      include: {
        doctorFacilities: { select: { facilityId: true } },
        user: { select: { id: true, email: true, name: true } },
      },
    }),
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!doctor) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/admin/doctors"
            className="text-sm text-indigo-700 hover:underline"
          >
            ← All doctors
          </Link>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">{doctor.fullName}</h1>
          <p className="mt-1 text-xs text-slate-500">
            {doctor.profileClaimed ? "Claimed profile" : "Admin-created profile"}
            {doctor.user ? ` · ${doctor.user.email}` : ""}
          </p>
        </div>
        <form action={deleteDoctorAction}>
          <input type="hidden" name="id" value={doctor.id} />
          <button
            type="submit"
            className="rounded-2xl border border-rose-200 px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50"
          >
            Delete doctor
          </button>
        </form>
      </div>

      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <DoctorEditForm
          doctor={{
            id: doctor.id,
            fullName: doctor.fullName,
            gender: doctor.gender ?? null,
            bmdcNumber: doctor.bmdcNumber,
            experienceYears: doctor.experienceYears,
            consultationFee: doctor.consultationFee,
            about: doctor.about,
            phone: doctor.phone,
            email: doctor.email,
            website: doctor.website,
            facebook: doctor.facebook,
            linkedin: doctor.linkedin,
            hospitalName: doctor.hospitalName,
            chamberAddress: doctor.chamberAddress,
            city: doctor.city,
            area: doctor.area,
            specialtyId: doctor.specialtyId,
            isVerified: doctor.isVerified,
            status: doctor.status,
            facilityIds: doctor.doctorFacilities.map((df) => df.facilityId),
          }}
          specialties={specialties.map((s) => ({ id: s.id, name: s.name }))}
          facilities={facilities.map((f) => ({ id: f.id, name: f.name, type: f.type }))}
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Public profile</h2>
        <p className="mt-1 text-sm text-slate-600">
          <Link
            href={`/doctor/${doctor.slug}`}
            className="font-semibold text-indigo-700 hover:underline"
          >
            /doctor/{doctor.slug}
          </Link>
        </p>
      </div>
    </div>
  );
}
