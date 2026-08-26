"use client";

import { useState, useMemo } from "react";
import { useActionState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Trash2,
  MapPin,
  Phone,
  Hospital,
  Sparkles,
  Stethoscope,
  Pill,
  Home,
  X,
  Check,
  Filter,
  UserCheck,
  ArrowUpDown,
  FlaskConical,
  ExternalLink,
} from "lucide-react";
import { createFacilityAction, updateFacilityAction, deleteFacilityAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { FacilityType } from "@/lib/enums";

export type FacilityData = {
  id: number;
  name: string;
  slug: string;
  type: string;
  address: string | null;
  phone: string | null;
  upazilaId: number;
  upazilaName: string;
  districtName: string;
  divisionName: string;
  doctorCount: number;
  testCount?: number;
};

export type UpazilaOption = {
  id: number;
  name: string;
  districtName: string;
};

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  HOSPITAL: {
    label: "Hospital",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Hospital,
  },
  DIAGNOSTIC: {
    label: "Diagnostic Center",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    icon: Sparkles,
  },
  CLINIC: {
    label: "Clinic",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Stethoscope,
  },
  PHARMACY: {
    label: "Pharmacy",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: Pill,
  },
  CHAMBER: {
    label: "Doctor Chamber",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Home,
  },
};

export default function FacilitiesManager({
  initialFacilities,
  upazilas,
}: {
  initialFacilities: FacilityData[];
  upazilas: UpazilaOption[];
}) {
  const [facilities, setFacilities] = useState<FacilityData[]>(initialFacilities);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [districtFilter, setDistrictFilter] = useState<string>("ALL");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFacility, setEditingFacility] = useState<FacilityData | null>(null);

  // Actions
  const [createState, createAction, createPending] = useActionState(createFacilityAction, initialFormState);
  const [updateState, updateAction, updatePending] = useActionState(updateFacilityAction, initialFormState);

  // Extract unique districts for filtering
  const districts = useMemo(() => {
    const set = new Set<string>();
    for (const f of initialFacilities) {
      if (f.districtName) set.add(f.districtName);
    }
    return Array.from(set).sort();
  }, [initialFacilities]);

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter((f) => {
      // Type filter
      if (typeFilter !== "ALL" && f.type !== typeFilter) {
        return false;
      }
      // District filter
      if (districtFilter !== "ALL" && f.districtName !== districtFilter) {
        return false;
      }
      // Search term
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchName = f.name.toLowerCase().includes(q);
        const matchAddress = (f.address || "").toLowerCase().includes(q);
        const matchPhone = (f.phone || "").toLowerCase().includes(q);
        const matchUpazila = f.upazilaName.toLowerCase().includes(q);
        const matchDistrict = f.districtName.toLowerCase().includes(q);
        if (!matchName && !matchAddress && !matchPhone && !matchUpazila && !matchDistrict) {
          return false;
        }
      }
      return true;
    });
  }, [facilities, typeFilter, districtFilter, searchTerm]);

  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  const renderTypeBadge = (type: string) => {
    const config = TYPE_CONFIG[type] || {
      label: type,
      bg: "bg-slate-50",
      text: "text-slate-700",
      border: "border-slate-200",
      icon: Building2,
    };
    const Icon = config.icon;
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-900">Facilities</h1>
          <p className="mt-1 text-sm text-slate-600">
            Manage diagnostic centers, hospitals, clinics, pharmacies, and chambers.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowAddForm((prev) => !prev);
            setEditingFacility(null);
          }}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition cursor-pointer"
        >
          {showAddForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showAddForm ? "Close Add Form" : "Add New Facility"}
        </button>
      </div>

      {/* Add Facility Form Card (Collapsible) */}
      {showAddForm && (
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-indigo-600" />
              <h2 className="text-lg font-semibold text-slate-900">Create New Facility</h2>
            </div>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {createState.message && !createState.ok && (
            <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {createState.message}
            </div>
          )}

          <form action={createAction} className="grid gap-4 md:grid-cols-2">
            <div>
              <label className={labelCls}>Facility Name *</label>
              <input
                name="name"
                required
                placeholder="e.g. Popular Diagnostic Center"
                className={inputCls}
              />
              {fieldError(createState, "name") && (
                <p className="mt-1 text-xs text-rose-700">{fieldError(createState, "name")}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Facility Type *</label>
              <select name="type" defaultValue={FacilityType.DIAGNOSTIC} className={inputCls}>
                {Object.values(FacilityType).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_CONFIG[t]?.label || t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelCls}>Upazila & District *</label>
              <select name="upazilaId" required className={inputCls} defaultValue="">
                <option value="">Select Upazila / Location</option>
                {upazilas.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.districtName})
                  </option>
                ))}
              </select>
              {fieldError(createState, "upazilaId") && (
                <p className="mt-1 text-xs text-rose-700">{fieldError(createState, "upazilaId")}</p>
              )}
            </div>

            <div>
              <label className={labelCls}>Phone / Hotline</label>
              <input
                name="phone"
                placeholder="e.g. +880 1711-223344"
                className={inputCls}
              />
              {fieldError(createState, "phone") && (
                <p className="mt-1 text-xs text-rose-700">{fieldError(createState, "phone")}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className={labelCls}>Full Street Address</label>
              <textarea
                name="address"
                rows={2}
                placeholder="e.g. House #16, Road #2, Dhanmondi, Dhaka-1205"
                className={inputCls}
              />
            </div>

            <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createPending}
                className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
              >
                {createPending ? "Creating..." : "Save Facility"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Facility Modal */}
      {editingFacility && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" />
                <h2 className="text-lg font-semibold text-slate-900">
                  Edit Facility: {editingFacility.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setEditingFacility(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {updateState.message && !updateState.ok && (
              <div className="mb-4 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {updateState.message}
              </div>
            )}

            <form action={updateAction} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="id" value={editingFacility.id} />

              <div>
                <label className={labelCls}>Facility Name *</label>
                <input
                  name="name"
                  defaultValue={editingFacility.name}
                  required
                  className={inputCls}
                />
                {fieldError(updateState, "name") && (
                  <p className="mt-1 text-xs text-rose-700">{fieldError(updateState, "name")}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Facility Type *</label>
                <select
                  name="type"
                  defaultValue={editingFacility.type}
                  className={inputCls}
                >
                  {Object.values(FacilityType).map((t) => (
                    <option key={t} value={t}>
                      {TYPE_CONFIG[t]?.label || t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Upazila & District *</label>
                <select
                  name="upazilaId"
                  required
                  defaultValue={editingFacility.upazilaId}
                  className={inputCls}
                >
                  {upazilas.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.districtName})
                    </option>
                  ))}
                </select>
                {fieldError(updateState, "upazilaId") && (
                  <p className="mt-1 text-xs text-rose-700">{fieldError(updateState, "upazilaId")}</p>
                )}
              </div>

              <div>
                <label className={labelCls}>Phone / Hotline</label>
                <input
                  name="phone"
                  defaultValue={editingFacility.phone ?? ""}
                  placeholder="e.g. +880 1711-223344"
                  className={inputCls}
                />
                {fieldError(updateState, "phone") && (
                  <p className="mt-1 text-xs text-rose-700">{fieldError(updateState, "phone")}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className={labelCls}>Full Street Address</label>
                <textarea
                  name="address"
                  rows={2}
                  defaultValue={editingFacility.address ?? ""}
                  placeholder="e.g. House #16, Road #2, Dhanmondi, Dhaka-1205"
                  className={inputCls}
                />
              </div>

              <div className="md:col-span-2 flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingFacility(null)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatePending}
                  className="rounded-2xl bg-indigo-600 px-5 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition"
                >
                  {updatePending ? "Saving changes..." : "Update Facility"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Search & Filters Bar */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by facility name, address, phone, upazila, district..."
              className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-2.5 pl-10 pr-10 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {districts.length > 0 && (
            <div className="w-full md:w-56 shrink-0">
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 px-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="ALL">All Districts</option>
                {districts.map((d) => (
                  <option key={d} value={d}>
                    {d} District
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Type Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
          <span className="text-xs font-medium text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5" /> Type:
          </span>
          <button
            type="button"
            onClick={() => setTypeFilter("ALL")}
            className={`rounded-xl px-3 py-1 text-xs font-semibold transition cursor-pointer ${
              typeFilter === "ALL"
                ? "bg-slate-950 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All ({facilities.length})
          </button>
          {Object.entries(TYPE_CONFIG).map(([key, config]) => {
            const count = facilities.filter((f) => f.type === key).length;
            const isSelected = typeFilter === key;
            const Icon = config.icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTypeFilter(key)}
                className={`inline-flex items-center gap-1 rounded-xl px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                <Icon className="h-3 w-3" />
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Facilities Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Showing {filteredFacilities.length} of {facilities.length} Facilities
          </div>
          {(searchTerm || typeFilter !== "ALL" || districtFilter !== "ALL") && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm("");
                setTypeFilter("ALL");
                setDistrictFilter("ALL");
              }}
              className="text-xs font-medium text-indigo-600 hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Facility Name & Type</th>
                <th className="px-6 py-3.5">Location & Address</th>
                <th className="px-6 py-3.5">Phone / Contact</th>
                <th className="px-6 py-3.5 text-center">Doctors</th>
                <th className="px-6 py-3.5 text-center">Tests & Pricing</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFacilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-slate-50/70 transition">
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="font-semibold text-slate-900 text-sm flex items-center gap-1.5">
                        <Link
                          href={`/facility/${facility.slug}`}
                          target="_blank"
                          className="hover:text-indigo-600 transition"
                          title="Open public page"
                        >
                          {facility.name}
                        </Link>
                        <ExternalLink className="h-3 w-3 text-slate-400" />
                      </div>
                      <div>{renderTypeBadge(facility.type)}</div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-600 max-w-xs">
                    <div className="space-y-0.5">
                      <div className="font-medium text-slate-800 flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                        <span>
                          {facility.upazilaName}, {facility.districtName}
                        </span>
                      </div>
                      {facility.address && (
                        <div className="text-slate-500 truncate" title={facility.address}>
                          {facility.address}
                        </div>
                      )}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-xs text-slate-600">
                    {facility.phone ? (
                      <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                        <Phone className="h-3 w-3 text-slate-400" /> {facility.phone}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>

                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-800">
                      <UserCheck className="h-3 w-3 text-slate-500" />
                      {facility.doctorCount}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-center">
                    <Link
                      href={`/admin/facilities/${facility.id}/tests`}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-bold text-teal-900 hover:bg-teal-100 transition shadow-2xs"
                      title="Manage Diagnostic Test Catalog & Pricing for this facility"
                    >
                      <FlaskConical className="h-3.5 w-3.5 text-teal-700" />
                      <span>{facility.testCount ?? 0} Tests (৳)</span>
                    </Link>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/admin/facilities/${facility.id}/tests`}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
                        title="Manage Tests"
                      >
                        <FlaskConical className="h-3 w-3 text-teal-600" />
                        Tests
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setEditingFacility(facility);
                          setShowAddForm(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition cursor-pointer"
                        title="Edit Facility Details"
                      >
                        <Edit2 className="h-3 w-3" />
                        Edit
                      </button>

                      <form
                        action={deleteFacilityAction}
                        onSubmit={(e) => {
                          if (
                            !confirm(
                              `Are you sure you want to delete "${facility.name}"? This action cannot be undone.`
                            )
                          ) {
                            e.preventDefault();
                          }
                        }}
                        className="inline"
                      >
                        <input type="hidden" name="id" value={facility.id} />
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                          title="Delete Facility"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredFacilities.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <Building2 className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-800">No facilities found</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {searchTerm || typeFilter !== "ALL" || districtFilter !== "ALL"
                        ? "Try clearing or modifying your search filters."
                        : "Click 'Add New Facility' above to create your first facility."}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
