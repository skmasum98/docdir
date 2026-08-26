"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { updateOwnDoctorProfileAction } from "@/lib/actions/doctor";
import { initialFormState, fieldError } from "@/lib/form";
import { ProfileImageUploader } from "@/components/profile-image-uploader";
import { FacilitySearchPicker, FacilityItem } from "@/components/facility-search-picker";
import { ExternalLink, Stethoscope, Clock, Phone, MapPin, DollarSign, Award, Building2 } from "lucide-react";

type Doctor = {
  id: number;
  fullName: string;
  profilePhoto: string | null;
  degrees: string;
  designation: string;
  gender: "MALE" | "FEMALE" | "OTHER" | null;
  bmdcNumber: string;
  experienceYears: number;
  consultationFee: number;
  followUpFee: number;
  visitingHours: string;
  services: string;
  about: string;
  phone: string;
  appointmentPhone: string;
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
  attachedFacilities = [],
}: {
  doctor: Doctor;
  specialties: Specialty[];
  attachedFacilities?: FacilityItem[];
}) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(doctor.profilePhoto);
  const [hospitalName, setHospitalName] = useState(doctor.hospitalName);
  const [chamberAddress, setChamberAddress] = useState(doctor.chamberAddress);
  const [state, formAction, pending] = useActionState(
    updateOwnDoctorProfileAction,
    initialFormState,
  );

  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none";
  const labelCls = "mb-1.5 block text-sm font-medium text-slate-700";
  const errCls = "mt-1 text-xs text-rose-700";

  return (
    <div className="space-y-6">
      {/* Profile Photo Uploader Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-2">Doctor Profile Photo</h2>
        <ProfileImageUploader
          currentImageUrl={photoUrl}
          userName={doctor.fullName}
          onImageUploaded={(url) => setPhotoUrl(url)}
          label="Upload or update your doctor photo"
          subLabel="Your photo will be displayed prominently across search results and patient profiles"
        />
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Doctor Profile Information</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured professional data visible to patients and search engines.
            </p>
          </div>
          <Link
            href={`/doctor/${doctor.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
          >
            Preview Public Page <ExternalLink className="h-4 w-4" />
          </Link>
        </div>

        {state.message && (
          <div className="mt-5 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            {state.message}
          </div>
        )}

        <form action={formAction} className="mt-6 space-y-8">
          <input type="hidden" name="profilePhoto" value={photoUrl || ""} />

          {/* Section 1: Basic & Identity */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">Credentials & Identity</h3>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelCls}>Full name with Title *</label>
                <input
                  name="fullName"
                  defaultValue={doctor.fullName}
                  placeholder="e.g. Prof. Dr. Mohammad Ali"
                  required
                  className={inputCls}
                />
                {fieldError(state, "fullName") && (
                  <p className={errCls}>{fieldError(state, "fullName")}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Medical Degrees & Qualifications</label>
                <input
                  name="degrees"
                  defaultValue={doctor.degrees}
                  placeholder="e.g. MBBS (DMC), FCPS (Medicine), MD (Cardiology), FACC"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">Separated by commas</p>
              </div>

              <div>
                <label className={labelCls}>Current Designation & Title</label>
                <input
                  name="designation"
                  defaultValue={doctor.designation}
                  placeholder="e.g. Associate Professor & Senior Consultant"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Primary Medical Specialty</label>
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
                <label className={labelCls}>BMDC Registration Number</label>
                <input
                  name="bmdcNumber"
                  defaultValue={doctor.bmdcNumber}
                  placeholder="e.g. A-12345"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">Crucial for verified doctor badge</p>
              </div>

              <div>
                <label className={labelCls}>Years of Active Practice / Experience</label>
                <input
                  name="experienceYears"
                  type="number"
                  min={0}
                  defaultValue={doctor.experienceYears}
                  placeholder="e.g. 12"
                  className={inputCls}
                />
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
            </div>
          </div>

          {/* Section 2: Clinical Services & Expertise */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">Clinical Focus & Services</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Conditions Treated & Services Offered</label>
                <input
                  name="services"
                  defaultValue={doctor.services}
                  placeholder="e.g. Hypertension, Chest Pain, ECG, Angiogram, Heart Failure, Echocardiogram, Preventive Cardiology"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Enter comma-separated items. These will be formatted as badges and indexed by search engines for condition-specific searches.
                </p>
              </div>

              <div>
                <label className={labelCls}>About Doctor & Care Philosophy</label>
                <textarea
                  name="about"
                  defaultValue={doctor.about}
                  rows={4}
                  placeholder="Describe your background, areas of clinical interest, and patient care approach..."
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Chamber, Timings & Fees */}
          <div className="pt-4 border-t border-slate-100 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Building2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Affiliated Facilities & Practice Centers</h3>
              </div>
              <FacilitySearchPicker
                initialFacilities={attachedFacilities}
                onApplyAsChamber={(facility) => {
                  if (facility.name) setHospitalName(facility.name);
                  if (facility.address) setChamberAddress(facility.address);
                }}
              />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-semibold text-slate-900">Chamber, Visiting Hours & Fees</h3>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Hospital / Clinic Name</label>
                  <input
                    name="hospitalName"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. Popular Diagnostic Center, Dhanmondi"
                    className={inputCls}
                  />
                </div>

                <div>
                  <label className={labelCls}>Visiting Schedule / Days & Hours</label>
                  <input
                    name="visitingHours"
                    defaultValue={doctor.visitingHours}
                    placeholder="e.g. Saturday - Thursday: 5:00 PM - 9:00 PM (Friday Closed)"
                    className={inputCls}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelCls}>Chamber Detailed Address & Room</label>
                  <textarea
                    name="chamberAddress"
                    value={chamberAddress}
                    onChange={(e) => setChamberAddress(e.target.value)}
                    rows={2}
                    placeholder="e.g. House #16, Road #2, Room #304 (3rd Floor), Dhanmondi, Dhaka-1205"
                    className={inputCls}
                  />
                </div>

              <div>
                <label className={labelCls}>City / District</label>
                <input
                  name="city"
                  defaultValue={doctor.city}
                  placeholder="e.g. Dhaka"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Area / Thana</label>
                <input
                  name="area"
                  defaultValue={doctor.area}
                  placeholder="e.g. Dhanmondi"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>New Patient Consultation Fee (BDT ৳)</label>
                <input
                  name="consultationFee"
                  type="number"
                  min={0}
                  defaultValue={doctor.consultationFee || ""}
                  placeholder="e.g. 1500"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Follow-up Consultation Fee (BDT ৳)</label>
                <input
                  name="followUpFee"
                  type="number"
                  min={0}
                  defaultValue={doctor.followUpFee || ""}
                  placeholder="e.g. 800"
                  className={inputCls}
                />
              </div>
            </div>
          </div>
        </div>

          {/* Section 4: Contact & Appointments */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-indigo-600" />
              <h3 className="text-base font-semibold text-slate-900">Appointment Serial & Contacts</h3>
            </div>
            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className={labelCls}>Appointment / Serial Booking Hotline</label>
                <input
                  name="appointmentPhone"
                  defaultValue={doctor.appointmentPhone}
                  placeholder="e.g. +880 1711-223344"
                  className={inputCls}
                />
                <p className="mt-1 text-xs text-slate-500">Patients click this directly to book</p>
              </div>

              <div>
                <label className={labelCls}>Direct Phone / Mobile</label>
                <input
                  name="phone"
                  defaultValue={doctor.phone}
                  placeholder="e.g. +880 1912-345678"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Official Email</label>
                <input
                  name="email"
                  type="email"
                  defaultValue={doctor.email}
                  placeholder="e.g. doctor@hospital.com"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Personal / Professional Website</label>
                <input
                  name="website"
                  defaultValue={doctor.website}
                  placeholder="https://..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Facebook Page or Profile</label>
                <input
                  name="facebook"
                  defaultValue={doctor.facebook}
                  placeholder="https://facebook.com/..."
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>LinkedIn Profile</label>
                <input
                  name="linkedin"
                  defaultValue={doctor.linkedin}
                  placeholder="https://linkedin.com/in/..."
                  className={inputCls}
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="submit"
              disabled={pending}
              className="rounded-2xl bg-slate-950 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 disabled:opacity-60 transition"
            >
              {pending ? "Saving profile..." : "Save Doctor Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
