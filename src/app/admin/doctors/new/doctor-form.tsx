"use client";

import { useActionState } from "react";
import { createDoctorAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { DoctorStatus, Gender } from "@/lib/enums";

type Specialty = { id: number; name: string };
type Facility = { id: number; name: string; type: string };

export default function DoctorCreateForm({
  specialties,
  facilities,
}: {
  specialties: Specialty[];
  facilities: Facility[];
}) {
  const [state, formAction, pending] = useActionState(createDoctorAction, initialFormState);
  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="grid gap-5 md:grid-cols-2">
      {state.message && !state.ok && (
        <div className="md:col-span-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.message}
        </div>
      )}

      <div>
        <label className={labelCls}>Full name *</label>
        <input name="fullName" required className={inputCls} />
        {fieldError(state, "fullName") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "fullName")}</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Specialty</label>
        <select name="specialtyId" className={inputCls} defaultValue="">
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
        <select name="gender" className={inputCls} defaultValue="">
          <option value="">—</option>
          {Object.values(Gender).map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>BMDC number</label>
        <input name="bmdcNumber" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Experience (years)</label>
        <input name="experienceYears" type="number" min={0} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Consultation fee (BDT)</label>
        <input name="consultationFee" type="number" min={0} className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>About</label>
        <textarea name="about" rows={4} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input name="phone" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input name="email" type="email" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Website</label>
        <input name="website" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Hospital</label>
        <input name="hospitalName" className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>Chamber address</label>
        <textarea name="chamberAddress" rows={2} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>City</label>
        <input name="city" className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Area</label>
        <input name="area" className={inputCls} />
      </div>

      <div className="md:col-span-2">
        <label className={labelCls}>Facilities</label>
        <select
          name="facilityIds"
          multiple
          className={`${inputCls} h-32`}
        >
          {facilities.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name} ({f.type})
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-slate-500">Hold Ctrl/Cmd to select multiple.</p>
      </div>

      <div>
        <label className={labelCls}>Status</label>
        <select name="status" defaultValue={DoctorStatus.PUBLISHED} className={inputCls}>
          {Object.values(DoctorStatus).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input id="isVerified" name="isVerified" type="checkbox" className="h-4 w-4" />
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
          {pending ? "Saving..." : "Create doctor"}
        </button>
      </div>
    </form>
  );
}
