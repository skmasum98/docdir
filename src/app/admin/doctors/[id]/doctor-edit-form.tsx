"use client";

import { useActionState } from "react";
import { updateDoctorAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { DoctorStatus, Gender } from "@/lib/enums";

type Doctor = {
  id: number;
  fullName: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  bmdcNumber: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  about: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  facebook: string | null;
  linkedin: string | null;
  hospitalName: string | null;
  chamberAddress: string | null;
  city: string | null;
  area: string | null;
  specialtyId: number | null;
  isVerified: boolean;
  status: "DRAFT" | "PUBLISHED" | "BLOCKED";
  facilityIds: number[];
};

type Specialty = { id: number; name: string };
type Facility = { id: number; name: string; type: string };

export default function DoctorEditForm({
  doctor,
  specialties,
  facilities,
}: {
  doctor: Doctor;
  specialties: Specialty[];
  facilities: Facility[];
}) {
  const [state, formAction, pending] = useActionState(updateDoctorAction, initialFormState);
  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      <input type="hidden" name="id" value={doctor.id} />

      {state.message && !state.ok && (
        <div className="md:col-span-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.message}
        </div>
      )}

      <div>
        <label className={labelCls}>Full name</label>
        <input name="fullName" defaultValue={doctor.fullName} className={inputCls} />
        {fieldError(state, "fullName") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "fullName")}</p>
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
          <option value="">—</option>
          {Object.values(Gender).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>BMDC</label>
        <input name="bmdcNumber" defaultValue={doctor.bmdcNumber ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Experience (years)</label>
        <input
          name="experienceYears"
          type="number"
          min={0}
          defaultValue={doctor.experienceYears ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>Consultation fee</label>
        <input
          name="consultationFee"
          type="number"
          min={0}
          defaultValue={doctor.consultationFee ?? ""}
          className={inputCls}
        />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>About</label>
        <textarea name="about" rows={4} defaultValue={doctor.about ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input name="phone" defaultValue={doctor.phone ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input name="email" type="email" defaultValue={doctor.email ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Website</label>
        <input name="website" defaultValue={doctor.website ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Hospital</label>
        <input
          name="hospitalName"
          defaultValue={doctor.hospitalName ?? ""}
          className={inputCls}
        />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>Chamber address</label>
        <textarea
          name="chamberAddress"
          rows={2}
          defaultValue={doctor.chamberAddress ?? ""}
          className={inputCls}
        />
      </div>
      <div>
        <label className={labelCls}>City</label>
        <input name="city" defaultValue={doctor.city ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Area</label>
        <input name="area" defaultValue={doctor.area ?? ""} className={inputCls} />
      </div>

      <div className="md:col-span-2">
        <label className={labelCls}>Facilities</label>
        <select name="facilityIds" multiple className={`${inputCls} h-32`}>
          {facilities.map((f) => (
            <option
              key={f.id}
              value={f.id}
              selected={doctor.facilityIds.includes(f.id)}
            >
              {f.name} ({f.type})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelCls}>Status</label>
        <select name="status" defaultValue={doctor.status} className={inputCls}>
          {Object.values(DoctorStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input
          id="isVerified"
          name="isVerified"
          type="checkbox"
          defaultChecked={doctor.isVerified}
          className="h-4 w-4"
        />
        <label htmlFor="isVerified" className="text-sm text-slate-700">
          Verified
        </label>
      </div>

      <div className="md:col-span-2 flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
