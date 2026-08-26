"use client";

import { useState, useMemo, useActionState } from "react";
import Link from "next/link";
import {
  FlaskConical,
  Search,
  Plus,
  Edit2,
  Trash2,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Clock,
  Home,
  CheckCircle2,
  X,
  DollarSign,
  Percent,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Tag,
  AlertCircle,
  Building2,
  HelpCircle,
} from "lucide-react";
import {
  createFacilityTestAction,
  updateFacilityTestAction,
  deleteFacilityTestAction,
  seedFacilityTestsAction,
  bulkDiscountFacilityTestsAction,
} from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";

export type FacilityTestItem = {
  id: number;
  facilityId: number;
  code: string;
  name: string;
  category: string;
  price: number;
  discountPrice: number | null;
  sampleType: string | null;
  deliveryTime: string | null;
  preparation: string | null;
  homeSampleAvailable: boolean;
  description: string | null;
  isActive: boolean;
};

interface FacilityTestsEditorProps {
  facility: {
    id: number;
    name: string;
    slug: string;
    type: string;
    address: string | null;
    phone: string | null;
    upazilaName: string;
    districtName: string;
  };
  initialTests: FacilityTestItem[];
}

const CATEGORIES = [
  "Pathology",
  "Radiology & Imaging",
  "Cardiology",
  "Ultrasound (USG)",
  "Specialized & Endoscopy",
  "Health Packages",
  "Microbiology & Serology",
  "Biochemistry",
  "Histopathology",
  "Other Diagnostic Test",
];

const SAMPLE_TYPES = [
  "Blood",
  "Urine",
  "Digital Imaging",
  "Real-time Scan",
  "Stool",
  "Tissue",
  "Non-Invasive",
  "Swab",
  "Sputum",
  "Fluid",
  "Other",
];

export function FacilityTestsEditor({ facility, initialTests }: FacilityTestsEditorProps) {
  const [tests, setTests] = useState<FacilityTestItem[]>(initialTests);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTest, setEditingTest] = useState<FacilityTestItem | null>(null);
  const [showBulkDiscountModal, setShowBulkDiscountModal] = useState(false);
  const [discountPercent, setDiscountPercent] = useState("10");

  const [createState, createAction, createPending] = useActionState(
    createFacilityTestAction,
    initialFormState
  );
  const [updateState, updateAction, updatePending] = useActionState(
    updateFacilityTestAction,
    initialFormState
  );

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    for (const t of tests) {
      if (t.category) set.add(t.category);
    }
    return Array.from(set).sort();
  }, [tests]);

  const filteredTests = useMemo(() => {
    return tests.filter((t) => {
      const matchCat = selectedCategory === "ALL" || t.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });
  }, [tests, selectedCategory, searchQuery]);

  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-xs sm:text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none bg-white";
  const labelCls = "mb-1 block text-xs font-semibold text-slate-700";

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/admin/facilities" className="hover:text-slate-900 transition">
          Facilities
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-medium text-slate-900">{facility.name}</span>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-semibold text-indigo-600">Diagnostic Tests & Pricing</span>
      </nav>

      {/* Facility Header Banner */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
                <FlaskConical className="h-3 w-3" /> Diagnostic Catalog Manager
              </span>
              <span className="text-xs text-slate-500">
                {facility.upazilaName}, {facility.districtName}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              {facility.name}
            </h1>
            <p className="text-xs text-slate-600">
              Set laboratory tests, patient fee structure (BDT ৳), promotional discounts, turnaround times, and sample collection guidelines.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/facility/${facility.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
              <span>View Public Page</span>
            </Link>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Add Diagnostic Test</span>
            </button>
          </div>
        </div>

        {/* Quick Batch Operations Bar */}
        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-slate-600">
            <span>
              Total Catalog Tests: <strong className="text-slate-900 font-bold">{tests.length}</strong>
            </span>
            <span>
              Active for Patients:{" "}
              <strong className="text-emerald-700 font-bold">
                {tests.filter((t) => t.isActive).length}
              </strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Seed Standard Catalog Button */}
            <form action={seedFacilityTestsAction} className="inline">
              <input type="hidden" name="facilityId" value={facility.id} />
              <input type="hidden" name="overwrite" value="false" />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-900 hover:bg-teal-100 transition cursor-pointer"
                title="Populates standard 20+ diagnostic tests (CBC, MRI, Lipid, ECG, USG, etc.) if not already present"
              >
                <Sparkles className="h-3.5 w-3.5 text-teal-700" />
                <span>Auto-Seed Standard Catalog (20+ Tests)</span>
              </button>
            </form>

            {/* Bulk Discount Button */}
            <button
              type="button"
              onClick={() => setShowBulkDiscountModal(true)}
              className="inline-flex items-center gap-1 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition cursor-pointer"
            >
              <Percent className="h-3.5 w-3.5 text-amber-700" />
              <span>Apply Bulk Discount</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {createState.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
            createState.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          {createState.message}
        </div>
      )}
      {updateState.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-xs font-semibold ${
            updateState.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          {updateState.message}
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search test by name, test code (e.g. PATH-CBC), category, or sample type..."
            className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory("ALL")}
            className={`shrink-0 rounded-xl px-3 py-1.5 font-semibold transition ${
              selectedCategory === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            All Categories ({tests.length})
          </button>
          {categoriesList.map((cat) => {
            const count = tests.filter((t) => t.category === cat).length;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 font-semibold transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tests Table / List */}
      <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        {filteredTests.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-3">
            <FlaskConical className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="font-semibold text-slate-700">No diagnostic tests found in this filter.</p>
            <p className="max-w-md mx-auto text-slate-500">
              Click &quot;Auto-Seed Standard Catalog&quot; to populate 20+ medical tests or &quot;Add Diagnostic Test&quot; to create a custom test.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Code & Test Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price (BDT)</th>
                  <th className="py-3 px-4">Sample / Modality</th>
                  <th className="py-3 px-4">Delivery Time</th>
                  <th className="py-3 px-4 text-center">Home Sample</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTests.map((test) => (
                  <tr key={test.id} className="hover:bg-slate-50/60 transition group">
                    {/* Code & Name */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                            {test.code}
                          </span>
                          <span className="font-bold text-slate-900 text-sm">{test.name}</span>
                        </div>
                        {test.description && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 max-w-sm">
                            {test.description}
                          </p>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block rounded-lg bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
                        {test.category}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4 font-medium">
                      {test.discountPrice ? (
                        <div>
                          <span className="text-slate-400 line-through text-[11px] mr-1.5">
                            ৳{test.price.toLocaleString()}
                          </span>
                          <span className="font-bold text-slate-900 text-sm text-emerald-700">
                            ৳{test.discountPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 text-sm">
                          ৳{test.price.toLocaleString()}
                        </span>
                      )}
                    </td>

                    {/* Sample */}
                    <td className="py-3.5 px-4 text-slate-600">
                      {test.sampleType || "—"}
                    </td>

                    {/* Delivery Time */}
                    <td className="py-3.5 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        {test.deliveryTime || "Same Day"}
                      </span>
                    </td>

                    {/* Home Sample */}
                    <td className="py-3.5 px-4 text-center">
                      {test.homeSampleAvailable ? (
                        <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Home className="h-3 w-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Lab only</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center">
                      {test.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                          Disabled
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setEditingTest(test)}
                          className="rounded-lg p-1.5 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 transition cursor-pointer"
                          title="Edit Test Details & Price"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>

                        <form
                          action={deleteFacilityTestAction}
                          onSubmit={(e) => {
                            if (!confirm(`Are you sure you want to remove "${test.name}" from ${facility.name}'s test catalog?`)) {
                              e.preventDefault();
                            }
                          }}
                          className="inline"
                        >
                          <input type="hidden" name="id" value={test.id} />
                          <button
                            type="submit"
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                            title="Delete Test"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </form>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Test Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Add New Diagnostic Test to {facility.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await createAction(formData);
                setShowAddModal(false);
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <input type="hidden" name="facilityId" value={facility.id} />

              <div>
                <label className={labelCls}>Test Code *</label>
                <input
                  name="code"
                  required
                  placeholder="e.g. PATH-CBC, RAD-MRI-01"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Category *</label>
                <select name="category" required defaultValue="Pathology" className={inputCls}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Test Name *</label>
                <input
                  name="name"
                  required
                  placeholder="e.g. Complete Blood Count (CBC) with ESR"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Standard Price (BDT ৳) *</label>
                <input
                  type="number"
                  name="price"
                  required
                  min={0}
                  placeholder="e.g. 500"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Discounted Price (BDT ৳) (Optional)</label>
                <input
                  type="number"
                  name="discountPrice"
                  min={0}
                  placeholder="e.g. 450 (Leave empty if no discount)"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Sample Type / Modality</label>
                <select name="sampleType" defaultValue="Blood" className={inputCls}>
                  {SAMPLE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Report Turnaround Delivery Time</label>
                <input
                  name="deliveryTime"
                  placeholder="e.g. 3-4 Hours (Same Day), 24 Hours"
                  defaultValue="3-4 Hours (Same Day)"
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Patient Preparation Guidelines</label>
                <textarea
                  name="preparation"
                  rows={2}
                  placeholder="e.g. 10-12 hours strict overnight fasting required. Water is permitted."
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Test Description & Clinical Value</label>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="e.g. Evaluates overall health, detecting anemia, infections, leukemia, and platelet disorders."
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    name="homeSampleAvailable"
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Home Sample Collection Available for this Test</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createPending}
                    className="rounded-2xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {createPending ? "Saving..." : "Add to Catalog"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Test Modal */}
      {editingTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Edit Diagnostic Test: {editingTest.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTest(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              action={async (formData) => {
                await updateAction(formData);
                setEditingTest(null);
              }}
              className="grid gap-4 sm:grid-cols-2"
            >
              <input type="hidden" name="id" value={editingTest.id} />

              <div>
                <label className={labelCls}>Test Code *</label>
                <input
                  name="code"
                  required
                  defaultValue={editingTest.code}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Category *</label>
                <select name="category" required defaultValue={editingTest.category} className={inputCls}>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Test Name *</label>
                <input
                  name="name"
                  required
                  defaultValue={editingTest.name}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Standard Price (BDT ৳) *</label>
                <input
                  type="number"
                  name="price"
                  required
                  min={0}
                  defaultValue={editingTest.price}
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Discounted Price (BDT ৳)</label>
                <input
                  type="number"
                  name="discountPrice"
                  min={0}
                  defaultValue={editingTest.discountPrice ?? ""}
                  placeholder="Leave empty if no discount"
                  className={inputCls}
                />
              </div>

              <div>
                <label className={labelCls}>Sample Type / Modality</label>
                <select name="sampleType" defaultValue={editingTest.sampleType || "Blood"} className={inputCls}>
                  {SAMPLE_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelCls}>Report Turnaround Delivery Time</label>
                <input
                  name="deliveryTime"
                  defaultValue={editingTest.deliveryTime || ""}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Patient Preparation Guidelines</label>
                <textarea
                  name="preparation"
                  rows={2}
                  defaultValue={editingTest.preparation || ""}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2">
                <label className={labelCls}>Test Description & Clinical Value</label>
                <textarea
                  name="description"
                  rows={2}
                  defaultValue={editingTest.description || ""}
                  className={inputCls}
                />
              </div>

              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="homeSampleAvailable"
                      defaultChecked={editingTest.homeSampleAvailable}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Home Sample Available</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingTest.isActive}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Active in Public Directory</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTest(null)}
                    className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatePending}
                    className="rounded-2xl bg-indigo-600 px-5 py-2 text-xs font-bold text-white hover:bg-indigo-700 disabled:opacity-50 transition cursor-pointer"
                  >
                    {updatePending ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Discount Modal */}
      {showBulkDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Percent className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Bulk Discount Pricing
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkDiscountModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Quickly calculate and apply promotional discount prices across all {tests.length} diagnostic tests at <strong>{facility.name}</strong>.
            </p>

            <form
              action={async (formData) => {
                await bulkDiscountFacilityTestsAction(formData);
                setShowBulkDiscountModal(false);
              }}
              className="space-y-4"
            >
              <input type="hidden" name="facilityId" value={facility.id} />

              <div>
                <label className={labelCls}>Discount Percentage (%)</label>
                <select
                  name="percentage"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(e.target.value)}
                  className={inputCls}
                >
                  <option value="5">5% Off on All Tests</option>
                  <option value="10">10% Off on All Tests</option>
                  <option value="15">15% Off on All Tests</option>
                  <option value="20">20% Off on All Tests (Special Offer)</option>
                  <option value="25">25% Off on All Tests</option>
                  <option value="0">0% (Remove All Discounts / Reset to Standard)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBulkDiscountModal(false)}
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-amber-600 px-5 py-2 text-xs font-bold text-white hover:bg-amber-700 transition cursor-pointer"
                >
                  Apply to All Tests
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
