"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Building2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Ambulance,
  FlaskConical,
  Stethoscope,
  Plus,
  Trash2,
  Edit2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  Loader2,
  Save,
} from "lucide-react";
import {
  updateFacilityProfileSelfAction,
  facilityAddTestAction,
  facilityUpdateTestAction,
  facilityDeleteTestAction,
  facilityLinkDoctorAction,
  facilityUnlinkDoctorAction,
  facilityAddFromCatalogAction,
  facilityToggleTestStatusAction,
} from "@/lib/actions/facility";
import { CatalogPickerModal } from "@/components/catalog-picker-modal";
import { Sparkles, Check, Eye, EyeOff } from "lucide-react";

type FacilityData = {
  id: number;
  name: string;
  slug: string;
  type: string;
  phone: string | null;
  hotline: string | null;
  email: string | null;
  website: string | null;
  emergencyContact: string | null;
  address: string | null;
  isVerified: boolean;
  profileClaimed: boolean;
  upazila: {
    name: string;
    district: {
      name: string;
      division: { name: string };
    };
  } | null;
  tests: {
    id: number;
    code: string;
    name: string;
    category: string;
    price: number;
    discountPrice: number | null;
    sampleType: string | null;
    deliveryTime: string | null;
    preparation: string | null;
    homeSampleAvailable: boolean;
    isActive: boolean;
  }[];
  doctorFacilities: {
    id: number;
    doctor: {
      id: number;
      fullName: string;
      slug: string;
      degrees: string | null;
      designation: string | null;
      specialty: { name: string } | null;
      phone: string | null;
    };
  }[];
};

type DoctorOption = {
  id: number;
  fullName: string;
  degrees: string | null;
  specialty: { name: string } | null;
  phone: string | null;
};

type Props = {
  facilities: any[];
  specialties: any[];
  availableDoctors: DoctorOption[];
  initialTab?: string;
  isSaved?: boolean;
};

export default function FacilityManagerView({
  facilities,
  availableDoctors,
  initialTab = "profile",
  isSaved,
}: Props) {
  const [selectedFacilityIndex, setSelectedFacilityIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<"profile" | "tests" | "doctors">(
    (initialTab as any) || "profile"
  );
  const [isPending, startTransition] = useTransition();

  // Test modal state
  const [showAddTestModal, setShowAddTestModal] = useState(false);
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [editingTest, setEditingTest] = useState<any | null>(null);

  // Doctor link state
  const [doctorSearch, setDoctorSearch] = useState("");
  const [showLinkDoctorModal, setShowLinkDoctorModal] = useState(false);

  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    isSaved ? { type: "success", text: "Changes saved successfully!" } : null
  );

  const currentFacility: FacilityData = facilities[selectedFacilityIndex] || facilities[0];

  const existingTestCodes = new Set(
    currentFacility.tests.map((t) => t.code)
  );

  const affiliatedDoctorIds = new Set(
    currentFacility.doctorFacilities.map((df) => df.doctor.id)
  );

  const filteredDoctorsToLink = availableDoctors.filter((doc) => {
    if (affiliatedDoctorIds.has(doc.id)) return false;
    if (!doctorSearch.trim()) return true;
    const q = doctorSearch.toLowerCase();
    return (
      doc.fullName.toLowerCase().includes(q) ||
      doc.specialty?.name.toLowerCase().includes(q) ||
      doc.degrees?.toLowerCase().includes(q)
    );
  });

  // Handle Profile Update
  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await updateFacilityProfileSelfAction(currentFacility.id, undefined, fd);
      if (res.ok) {
        setMessage({ type: "success", text: res.message || "Profile updated!" });
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update profile." });
      }
    });
  };

  // Handle Add Test
  const handleAddTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await facilityAddTestAction(currentFacility.id, undefined, fd);
      if (res.ok) {
        setMessage({ type: "success", text: "Test added successfully!" });
        setShowAddTestModal(false);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to add test." });
      }
    });
  };

  // Handle Update Test
  const handleUpdateTest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingTest) return;
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await facilityUpdateTestAction(editingTest.id, currentFacility.id, undefined, fd);
      if (res.ok) {
        setMessage({ type: "success", text: "Test updated successfully!" });
        setEditingTest(null);
      } else {
        setMessage({ type: "error", text: res.message || "Failed to update test." });
      }
    });
  };

  // Handle Delete Test
  const handleDeleteTest = async (testId: number) => {
    if (!confirm("Are you sure you want to remove this diagnostic test?")) return;
    startTransition(async () => {
      await facilityDeleteTestAction(testId, currentFacility.id);
      setMessage({ type: "success", text: "Test deleted." });
    });
  };

  // Handle Toggle Active Status
  const handleToggleStatus = async (testId: number, currentStatus: boolean) => {
    startTransition(async () => {
      const res = await facilityToggleTestStatusAction(testId, currentFacility.id, !currentStatus);
      if (res.ok) {
        setMessage({
          type: "success",
          text: !currentStatus
            ? "Service/Test is now active and visible to patients."
            : "Service/Test deactivated from public view.",
        });
      }
    });
  };

  // Handle Link Doctor
  const handleLinkDoctor = async (doctorId: number) => {
    startTransition(async () => {
      await facilityLinkDoctorAction(currentFacility.id, doctorId);
      setMessage({ type: "success", text: "Doctor linked to facility roster!" });
      setShowLinkDoctorModal(false);
    });
  };

  // Handle Unlink Doctor
  const handleUnlinkDoctor = async (doctorId: number) => {
    if (!confirm("Remove doctor affiliation from this facility?")) return;
    startTransition(async () => {
      await facilityUnlinkDoctorAction(currentFacility.id, doctorId);
      setMessage({ type: "success", text: "Doctor unlinked from facility." });
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Switcher and Public Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-teal-100 px-2 py-0.5 text-xs font-bold uppercase text-teal-800">
              {currentFacility.type}
            </span>
            <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Management
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            {currentFacility.name}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentFacility.upazila
              ? `${currentFacility.upazila.name}${currentFacility.upazila.district?.name ? `, ${currentFacility.upazila.district.name}` : ""}`
              : currentFacility.address || "Bangladesh"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {facilities.length > 1 && (
            <select
              value={selectedFacilityIndex}
              onChange={(e) => setSelectedFacilityIndex(Number(e.target.value))}
              className="rounded-2xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {facilities.map((f, idx) => (
                <option key={f.id} value={idx}>
                  {f.name}
                </option>
              ))}
            </select>
          )}

          <Link
            href={`/facility/${currentFacility.slug}`}
            target="_blank"
            className="flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>Live Profile</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`rounded-2xl border p-4 text-xs font-semibold flex items-center justify-between gap-2 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-900"
          }`}
        >
          <div className="flex items-center gap-2">
            {message.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-xs opacity-70 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Primary Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab("profile")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "profile"
              ? "bg-teal-700 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>Profile & Contacts</span>
        </button>

        <button
          onClick={() => setActiveTab("tests")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "tests"
              ? "bg-teal-700 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <FlaskConical className="h-4 w-4" />
          <span>Diagnostic Test Pricing ({currentFacility.tests.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("doctors")}
          className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition ${
            activeTab === "doctors"
              ? "bg-teal-700 text-white shadow-xs"
              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
          }`}
        >
          <Stethoscope className="h-4 w-4" />
          <span>Doctor Roster ({currentFacility.doctorFacilities.length})</span>
        </button>
      </div>

      {/* TAB 1: PROFILE & CONTACTS */}
      {activeTab === "profile" && (
        <form
          onSubmit={handleProfileSubmit}
          className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6"
        >
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="h-5 w-5 text-teal-700" />
              General Information & Contact Desk
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              These details are publicly showcased for patients searching for appointments, emergency care, and inquiries.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Facility / Institute Name
              </label>
              <input
                type="text"
                name="name"
                defaultValue={currentFacility.name}
                required
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Central Hotline Number (Direct Calling)
              </label>
              <input
                type="text"
                name="hotline"
                defaultValue={currentFacility.hotline || currentFacility.phone || ""}
                placeholder="e.g. 09666 787801 or 10600"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Landline / Secondary Phone
              </label>
              <input
                type="text"
                name="phone"
                defaultValue={currentFacility.phone || ""}
                placeholder="e.g. 02-9111111 or 01700000000"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                24/7 Emergency & Ambulance Contact
              </label>
              <input
                type="text"
                name="emergencyContact"
                defaultValue={currentFacility.emergencyContact || ""}
                placeholder="e.g. 01711223344"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Official Email Address
              </label>
              <input
                type="email"
                name="email"
                defaultValue={currentFacility.email || ""}
                placeholder="e.g. info@popular-dhanmondi.com"
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                Website URL
              </label>
              <input
                type="url"
                name="website"
                defaultValue={currentFacility.website || ""}
                placeholder="https://..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700">
                Physical Street Address & Building Room Info
              </label>
              <textarea
                name="address"
                rows={3}
                defaultValue={currentFacility.address || ""}
                placeholder="e.g. House-16, Road-2, Dhanmondi, Dhaka-1205"
                className="w-full rounded-2xl border border-slate-300 p-3 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isPending}
              className="flex items-center gap-2 rounded-2xl bg-teal-700 px-6 py-3 text-xs font-bold text-white shadow-xs hover:bg-teal-800 transition disabled:opacity-50"
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Profile Changes
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: CLINICAL SERVICES & DIAGNOSTIC TESTS */}
      {activeTab === "tests" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-700" />
                Clinical Services & Diagnostic Tests Management
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your facility&apos;s active clinical units (ICU, Dialysis, Ambulance, 24/7 Emergency) and diagnostic pathology test fees.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCatalogModal(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Pick From Master Library</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddTestModal(true)}
                className="flex items-center gap-1.5 rounded-2xl bg-slate-100 border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-800 hover:bg-slate-200 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Custom Test</span>
              </button>
            </div>
          </div>

          {/* Test Table Card */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3.5 px-4">Service / Test</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Facility Price (৳)</th>
                    <th className="py-3.5 px-4">Discount (৳)</th>
                    <th className="py-3.5 px-4">Delivery / Turnaround</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentFacility.tests.map((test) => (
                    <tr
                      key={test.id}
                      className={`hover:bg-slate-50/60 transition ${
                        !test.isActive ? "opacity-60 bg-slate-50/40" : ""
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{test.name}</span>
                          {!test.isActive && (
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                              Hidden
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-slate-500">{test.code}</div>
                        {test.homeSampleAvailable && (
                          <span className="inline-block mt-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-800">
                            Home Collection Available
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 font-semibold text-slate-700">
                          {test.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        ৳{test.price.toLocaleString("en-BD")}
                      </td>
                      <td className="py-3.5 px-4">
                        {test.discountPrice ? (
                          <span className="font-bold text-emerald-700">
                            ৳{test.discountPrice.toLocaleString("en-BD")}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        <div>{test.sampleType || "Non-Invasive / Lab"}</div>
                        <div className="text-[11px] text-slate-400">{test.deliveryTime || "Standard"}</div>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(test.id, test.isActive)}
                          disabled={isPending}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold transition cursor-pointer ${
                            test.isActive
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                          }`}
                          title="Click to toggle visibility on public facility page"
                        >
                          {test.isActive ? (
                            <>
                              <Eye className="h-3 w-3" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3" />
                              <span>Inactive</span>
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setEditingTest(test)}
                          className="rounded-xl border border-slate-200 bg-white p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                          title="Edit Test Pricing"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteTest(test.id)}
                          className="rounded-xl border border-rose-200 bg-rose-50 p-1.5 text-rose-700 hover:bg-rose-100 transition"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {currentFacility.tests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500 space-y-2">
                        <p>No clinical services or diagnostic tests offered yet.</p>
                        <button
                          type="button"
                          onClick={() => setShowCatalogModal(true)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                        >
                          <Sparkles className="h-4 w-4" />
                          <span>Open Master Template Library</span>
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DOCTOR ROSTER */}
      {activeTab === "doctors" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-teal-700" />
                Affiliated Practicing Doctors ({currentFacility.doctorFacilities.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage the medical specialists and consultants attached to this facility branch.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowLinkDoctorModal(true)}
              className="flex items-center gap-1.5 rounded-2xl bg-teal-700 px-4 py-2.5 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs"
            >
              <Plus className="h-4 w-4" />
              <span>Link Doctor to Roster</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentFacility.doctorFacilities.map((df) => (
              <div
                key={df.id}
                className="rounded-3xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-teal-200 transition space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800">
                      {df.doctor.specialty?.name || "General Practitioner"}
                    </span>
                    <Link
                      href={`/doctor/${df.doctor.slug}`}
                      target="_blank"
                      className="text-slate-400 hover:text-indigo-600"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2">{df.doctor.fullName}</h3>
                  {df.doctor.degrees && (
                    <p className="text-xs text-slate-600 line-clamp-1">{df.doctor.degrees}</p>
                  )}
                  {df.doctor.phone && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{df.doctor.phone}</span>
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleUnlinkDoctor(df.doctor.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-800"
                  >
                    <Trash2 className="h-3 w-3" /> Unlink
                  </button>
                </div>
              </div>
            ))}

            {currentFacility.doctorFacilities.length === 0 && (
              <div className="sm:col-span-2 lg:col-span-3 rounded-3xl border border-slate-200 bg-white p-10 text-center text-xs text-slate-500">
                No doctors currently affiliated. Click &quot;Link Doctor to Roster&quot; to connect doctors from the directory.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD DIAGNOSTIC TEST */}
      {showAddTestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Add Diagnostic Test</h3>
              <button
                type="button"
                onClick={() => setShowAddTestModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Test Code *</label>
                  <input
                    type="text"
                    name="code"
                    required
                    placeholder="e.g. CBC-01, MRI-BRAIN"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <input
                    type="text"
                    name="category"
                    required
                    placeholder="e.g. Hematology, Radiology, Pathology"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Test Full Name *</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) with ESR"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Standard Price (BDT) *</label>
                  <input
                    type="number"
                    name="price"
                    required
                    min={0}
                    placeholder="400"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Discounted Price (Optional)</label>
                  <input
                    type="number"
                    name="discountPrice"
                    min={0}
                    placeholder="350"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sample Specimen Type</label>
                  <input
                    type="text"
                    name="sampleType"
                    placeholder="e.g. Whole Blood, Fasting Urine"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Turnaround Delivery Time</label>
                  <input
                    type="text"
                    name="deliveryTime"
                    placeholder="e.g. 4 Hours / Same Evening"
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Patient Preparation Instructions</label>
                <input
                  type="text"
                  name="preparation"
                  placeholder="e.g. 10-12 hours overnight fasting required"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 font-semibold text-slate-800">
                <input
                  type="checkbox"
                  name="homeSampleAvailable"
                  value="true"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                <span>Home Sample Collection Available for this Test</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTestModal(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT DIAGNOSTIC TEST */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Edit Diagnostic Test</h3>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleUpdateTest} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Test Code *</label>
                  <input
                    type="text"
                    name="code"
                    defaultValue={editingTest.code}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Category *</label>
                  <input
                    type="text"
                    name="category"
                    defaultValue={editingTest.category}
                    required
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Test Full Name *</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingTest.name}
                  required
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Standard Price (BDT) *</label>
                  <input
                    type="number"
                    name="price"
                    defaultValue={editingTest.price}
                    required
                    min={0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Discounted Price (Optional)</label>
                  <input
                    type="number"
                    name="discountPrice"
                    defaultValue={editingTest.discountPrice || ""}
                    min={0}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Sample Specimen Type</label>
                  <input
                    type="text"
                    name="sampleType"
                    defaultValue={editingTest.sampleType || ""}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Turnaround Delivery Time</label>
                  <input
                    type="text"
                    name="deliveryTime"
                    defaultValue={editingTest.deliveryTime || ""}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700">Patient Preparation Instructions</label>
                <input
                  type="text"
                  name="preparation"
                  defaultValue={editingTest.preparation || ""}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-teal-600 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 font-semibold text-slate-800">
                <input
                  type="checkbox"
                  name="homeSampleAvailable"
                  defaultChecked={editingTest.homeSampleAvailable}
                  value="true"
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-600"
                />
                <span>Home Sample Collection Available for this Test</span>
              </label>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingTest(null)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="rounded-xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition"
                >
                  Update Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: LINK DOCTOR TO ROSTER */}
      {showLinkDoctorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Link Doctor to Facility Roster</h3>
              <button
                type="button"
                onClick={() => setShowLinkDoctorModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ×
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={doctorSearch}
                onChange={(e) => setDoctorSearch(e.target.value)}
                placeholder="Search doctor by name, specialty, degree..."
                className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-2.5 text-sm focus:border-teal-600 focus:outline-none"
              />
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 rounded-2xl border border-slate-200 flex-1">
              {filteredDoctorsToLink.slice(0, 30).map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 hover:bg-teal-50/40 transition flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <h4 className="font-bold text-slate-900">{doc.fullName}</h4>
                    <p className="text-slate-500">
                      {doc.specialty?.name || "Doctor"} {doc.degrees && `· ${doc.degrees}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLinkDoctor(doc.id)}
                    className="shrink-0 rounded-xl bg-teal-700 px-3 py-1.5 font-semibold text-white hover:bg-teal-800 transition"
                  >
                    + Add to Roster
                  </button>
                </div>
              ))}

              {filteredDoctorsToLink.length === 0 && (
                <div className="p-8 text-center text-xs text-slate-500">
                  No matching doctors found in directory.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRE-BUILT CLINICAL & DIAGNOSTIC MASTER LIBRARY PICKER */}
      <CatalogPickerModal
        isOpen={showCatalogModal}
        onClose={() => setShowCatalogModal(false)}
        facilityId={currentFacility.id}
        facilityName={currentFacility.name}
        existingCodes={existingTestCodes}
        importAction={facilityAddFromCatalogAction}
        onImportSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
}
