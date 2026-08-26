"use client";

import { useActionState, useState } from "react";
import { updateDoctorAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { DoctorStatus, Gender } from "@/lib/enums";
import { ProfileImageUploader } from "@/components/profile-image-uploader";
import { FacilitySearchPicker, FacilityItem } from "@/components/facility-search-picker";

type Doctor = {
  id: number;
  fullName: string;
  profilePhoto: string | null;
  degrees: string | null;
  designation: string | null;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  bmdcNumber: string | null;
  experienceYears: number | null;
  consultationFee: number | null;
  followUpFee: number | null;
  visitingHours: string | null;
  services: string | null;
  about: string | null;
  phone: string | null;
  appointmentPhone: string | null;
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

export default function DoctorEditForm({
  doctor,
  specialties,
  attachedFacilities = [],
}: {
  doctor: Doctor;
  specialties: Specialty[];
  attachedFacilities?: FacilityItem[];
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(doctor.profilePhoto);
  const [state, formAction, pending] = useActionState(updateDoctorAction, initialFormState);
  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="space-y-6">
      {/* Profile Image Uploader */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-3">Doctor Profile Photo</h2>
        <ProfileImageUploader
          currentImageUrl={photoUrl}
          userName={doctor.fullName}
          onImageUploaded={(url) => setPhotoUrl(url)}
          autoSave={false}
          label="Profile Picture"
          subLabel="Hosted via your personal image hosting API"
        />
      </div>

      <form action={formAction} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm grid gap-5 md:grid-cols-2">
        <input type="hidden" name="id" value={doctor.id} />
        <input type="hidden" name="profilePhoto" value={photoUrl || ""} />

        {state.message && !state.ok && (
          <div className="md:col-span-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {state.message}
          </div>
        )}

        <div>
          <label className={labelCls}>Full name *</label>
          <input name="fullName" defaultValue={doctor.fullName} required className={inputCls} />
          {fieldError(state, "fullName") && (
            <p className="mt-1 text-xs text-rose-700">{fieldError(state, "fullName")}</p>
          )}
        </div>

        <div>
          <label className={labelCls}>Degrees & Qualifications</label>
          <input name="degrees" defaultValue={doctor.degrees ?? ""} placeholder="MBBS, FCPS, MD..." className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Designation & Title</label>
          <input name="designation" defaultValue={doctor.designation ?? ""} placeholder="Associate Professor, Senior Consultant..." className={inputCls} />
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
          <label className={labelCls}>BMDC number</label>
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
          <label className={labelCls}>Consultation fee (BDT ৳)</label>
          <input
            name="consultationFee"
            type="number"
            min={0}
            defaultValue={doctor.consultationFee ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Follow-up fee (BDT ৳)</label>
          <input
            name="followUpFee"
            type="number"
            min={0}
            defaultValue={doctor.followUpFee ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Visiting Schedule & Hours</label>
          <input
            name="visitingHours"
            defaultValue={doctor.visitingHours ?? ""}
            placeholder="Sat - Thu: 5:00 PM - 9:00 PM"
            className={inputCls}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>Conditions Treated & Services (comma separated)</label>
          <input
            name="services"
            defaultValue={doctor.services ?? ""}
            placeholder="Hypertension, Heart Failure, ECG, Angioplasty..."
            className={inputCls}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelCls}>About</label>
          <textarea
            name="about"
            rows={4}
            defaultValue={doctor.about ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Appointment Hotline</label>
          <input name="appointmentPhone" defaultValue={doctor.appointmentPhone ?? ""} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Phone</label>
          <input name="phone" defaultValue={doctor.phone ?? ""} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Email</label>
          <input
            name="email"
            type="email"
            defaultValue={doctor.email ?? ""}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Website</label>
          <input name="website" defaultValue={doctor.website ?? ""} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Facebook</label>
          <input name="facebook" defaultValue={doctor.facebook ?? ""} className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>LinkedIn</label>
          <input name="linkedin" defaultValue={doctor.linkedin ?? ""} className={inputCls} />
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

        <div className="flex items-center gap-2 pt-6">
          <input
            id="isVerified"
            type="checkbox"
            name="isVerified"
            defaultChecked={doctor.isVerified}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="isVerified" className="text-sm font-medium text-slate-700">
            Verified BMDC badge
          </label>
        </div>

        <div className="md:col-span-2">
          <FacilitySearchPicker initialFacilities={attachedFacilities} />
        </div>

        <div className="md:col-span-2 flex items-center justify-end gap-3 pt-4">
          <button
            type="submit"
            disabled={pending}
            className="rounded-2xl bg-slate-950 px-6 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
