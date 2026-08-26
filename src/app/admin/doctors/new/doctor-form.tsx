"use client";

import { useActionState } from "react";
import { createDoctorAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { DoctorStatus, Gender } from "@/lib/enums";
import { FacilitySearchPicker } from "@/components/facility-search-picker";

type Specialty = { id: number; name: string };
type Facility = { id: number; name: string; type: string };

export default function DoctorCreateForm({
  specialties,
  facilities = [],
}: {
  specialties: Specialty[];
  facilities?: Facility[];
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
        <input name="fullName" required placeholder="Prof. Dr. Mohammad Ali" className={inputCls} />
        {fieldError(state, "fullName") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "fullName")}</p>
        )}
      </div>

      <div>
        <label className={labelCls}>Degrees & Qualifications</label>
        <input name="degrees" placeholder="MBBS, FCPS (Cardiology), MD" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Designation & Title</label>
        <input name="designation" placeholder="Associate Professor & Senior Consultant" className={inputCls} />
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
        <input name="bmdcNumber" placeholder="A-12345" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Experience (years)</label>
        <input name="experienceYears" type="number" min={0} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Consultation fee (BDT ৳)</label>
        <input name="consultationFee" type="number" min={0} placeholder="1500" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Follow-up fee (BDT ৳)</label>
        <input name="followUpFee" type="number" min={0} placeholder="800" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Visiting Schedule & Hours</label>
        <input name="visitingHours" placeholder="Sat - Thu: 5:00 PM - 9:00 PM" className={inputCls} />
      </div>

      <div className="md:col-span-2">
        <label className={labelCls}>Conditions Treated & Services (comma separated)</label>
        <input name="services" placeholder="Hypertension, Heart Failure, ECG, Angioplasty..." className={inputCls} />
      </div>

      <div className="md:col-span-2">
        <label className={labelCls}>About</label>
        <textarea name="about" rows={4} className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>Appointment Serial Hotline</label>
        <input name="appointmentPhone" placeholder="+880 1711-223344" className={inputCls} />
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
        <label className={labelCls}>Facebook</label>
        <input name="facebook" className={inputCls} />
      </div>

      <div>
        <label className={labelCls}>LinkedIn</label>
        <input name="linkedin" className={inputCls} />
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
        <FacilitySearchPicker />
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

      <div className="flex items-center gap-2 pt-6">
        <input id="isVerified" name="isVerified" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
        <label htmlFor="isVerified" className="text-sm font-medium text-slate-700">
          Verified BMDC badge
        </label>
      </div>

      <div className="md:col-span-2 flex gap-3 pt-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Create doctor"}
        </button>
      </div>
    </form>
  );
}
