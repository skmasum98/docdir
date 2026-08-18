"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateOwnDoctorProfileAction } from "@/lib/actions/doctor";
import { initialFormState, fieldError } from "@/lib/form";

type Doctor = {
  id: number;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  bmdcNumber: string;
  experienceYears: number;
  consultationFee: number;
  about: string;
  phone: string;
  email: string;
  website: string;
  facebook: string;
  linkedin: string;
  hospitalName: string;
  chamberAddress: string;
  city: string;
  area: string;
  specialtyId: number | null;
  slug: string;
};

type Specialty = { id: number; name: string };

export default function DoctorProfileForm({
  doctor,
  specialties,
}: {
  doctor: Doctor;
  specialties: Specialty[];
}) {
  const [state, formAction, pending] = useActionState(
    updateOwnDoctorProfileAction,
    initialFormState,
  );

  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";
  const errCls = "mt-1 text-xs text-rose-700";

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
          <Link
            href={`/doctor/${doctor.slug}`}
            className="text-sm font-semibold text-indigo-700 hover:underline"
          >
            View public page
          </Link>
        </div>

        {state.message && (
          <div className="mt-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {state.message}
          </div>
        )}

        <form action={formAction} className="mt-6 grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelCls}>Full name</label>
            <input name="fullName" defaultValue={doctor.fullName} required className={inputCls} />
            {fieldError(state, "fullName") && (
              <p className={errCls}>{fieldError(state, "fullName")}</p>
            )}
          </div>

          <div>
            <label className={labelCls}>Specialty</label>
            <select
              name="specialtyId"
              defaultValue={doctor.specialtyId ?? ""}
              className={inputCls}
            >
              <option value="">Select specialty</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Gender</label>
            <select name="gender" defaultValue={doctor.gender ?? ""} className={inputCls}>
              <option value="">Prefer not to say</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>BMDC registration number</label>
            <input name="bmdcNumber" defaultValue={doctor.bmdcNumber} className={inputCls} />
          </div>

          <div>
            <label className={labelCls}>Years of experience</label>
            <input
              name="experienceYears"
              type="number"
              min={0}
              defaultValue={doctor.experienceYears}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Consultation fee (BDT)</label>
            <input
              name="consultationFee"
              type="number"
              min={0}
              defaultValue={doctor.consultationFee}
              className={inputCls}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelCls}>About</label>
            <textarea
              name="about"
              defaultValue={doctor.about}
              rows={5}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Phone</label>
            <input name="phone" defaultValue={doctor.phone} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Email</label>
            <input
              name="email"
              type="email"
              defaultValue={doctor.email}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Website</label>
            <input name="website" defaultValue={doctor.website} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Facebook</label>
            <input name="facebook" defaultValue={doctor.facebook} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>LinkedIn</label>
            <input name="linkedin" defaultValue={doctor.linkedin} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Hospital name</label>
            <input
              name="hospitalName"
              defaultValue={doctor.hospitalName}
              className={inputCls}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelCls}>Chamber address</label>
            <textarea
              name="chamberAddress"
              defaultValue={doctor.chamberAddress}
              rows={2}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>City</label>
            <input name="city" defaultValue={doctor.city} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Area</label>
            <input name="area" defaultValue={doctor.area} className={inputCls} />
          </div>

          <div className="md:col-span-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {pending ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
