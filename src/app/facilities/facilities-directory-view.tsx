"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  Hospital,
  Sparkles,
  Stethoscope,
  Pill,
  Home,
  MapPin,
  Phone,
  Search,
  UserCheck,
  FlaskConical,
  Filter,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  X,
  Clock,
  Tag,
  DollarSign,
  HeartPulse,
  Ambulance,
} from "lucide-react";
import { FacilityLogo } from "@/components/facility-logo";

export type FacilityListItem = {
  id: number;
  name: string;
  slug: string;
  type: string;
  logo?: string | null;
  address: string | null;
  phone: string | null;
  upazila: {
    id: number;
    name: string;
    slug: string;
    district: {
      id: number;
      name: string;
      slug: string;
      division: {
        id: number;
        name: string;
        slug: string;
      };
    };
  };
  doctorCount: number;
  testCount: number;
  minPrice: number | null;
  maxPrice: number | null;
  testsPreview: Array<{
    name: string;
    code: string;
    price: number;
    discountPrice: number | null;
    category: string;
  }>;
};

export type DivisionOption = {
  id: number;
  name: string;
  slug: string;
  districts: Array<{
    id: number;
    name: string;
    slug: string;
    upazilas: Array<{
      id: number;
      name: string;
      slug: string;
    }>;
  }>;
};

interface FacilitiesDirectoryViewProps {
  facilities: FacilityListItem[];
  divisions: DivisionOption[];
  totalDoctors: number;
  totalTests: number;
}

const TYPE_FILTERS = [
  { id: "ALL", label: "All Facilities", icon: Building2 },
  { id: "HOSPITAL", label: "Hospitals", icon: Hospital },
  { id: "DIAGNOSTIC", label: "Diagnostic Centers & Labs", icon: FlaskConical },
  { id: "CLINIC", label: "Specialized Clinics", icon: Stethoscope },
  { id: "PHARMACY", label: "Pharmacies", icon: Pill },
  { id: "CHAMBER", label: "Doctor Chambers", icon: Home },
];

export function FacilitiesDirectoryView({
  facilities,
  divisions,
  totalDoctors,
  totalTests,
}: FacilitiesDirectoryViewProps) {
  const [activeTab, setActiveTab] = useState<"directory" | "test-explorer">("directory");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDivision, setSelectedDivision] = useState<string>("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("ALL");
  const [selectedUpazila, setSelectedUpazila] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"doctors" | "tests" | "name">("doctors");
  const [testSearchQuery, setTestSearchQuery] = useState("");

  // Districts for selected division
  const availableDistricts = useMemo(() => {
    if (selectedDivision === "ALL") {
      return divisions.flatMap((d) => d.districts);
    }
    const div = divisions.find((d) => d.slug === selectedDivision);
    return div ? div.districts : [];
  }, [divisions, selectedDivision]);

  // Upazilas for selected district
  const availableUpazilas = useMemo(() => {
    if (selectedDistrict === "ALL") {
      return availableDistricts.flatMap((d) => d.upazilas);
    }
    const dist = availableDistricts.find((d) => d.slug === selectedDistrict);
    return dist ? dist.upazilas : [];
  }, [availableDistricts, selectedDistrict]);

  // Filtered facilities
  const filteredFacilities = useMemo(() => {
    const result = facilities.filter((f) => {
      // Type
      if (selectedType !== "ALL" && f.type !== selectedType) return false;

      // Division
      if (selectedDivision !== "ALL" && f.upazila.district.division.slug !== selectedDivision) {
        return false;
      }

      // District
      if (selectedDistrict !== "ALL" && f.upazila.district.slug !== selectedDistrict) {
        return false;
      }

      // Upazila
      if (selectedUpazila !== "ALL" && f.upazila.slug !== selectedUpazila) {
        return false;
      }

      // Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = f.name.toLowerCase().includes(q);
        const matchAddress = (f.address || "").toLowerCase().includes(q);
        const matchUpazila = f.upazila.name.toLowerCase().includes(q);
        const matchDistrict = f.upazila.district.name.toLowerCase().includes(q);
        const matchTest = f.testsPreview.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.code.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
        if (!matchName && !matchAddress && !matchUpazila && !matchDistrict && !matchTest) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "doctors") return b.doctorCount - a.doctorCount;
      if (sortBy === "tests") return b.testCount - a.testCount;
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [
    facilities,
    selectedType,
    selectedDivision,
    selectedDistrict,
    selectedUpazila,
    searchQuery,
    sortBy,
  ]);

  // Test comparison matching items
  const testComparisonList = useMemo(() => {
    if (!testSearchQuery.trim()) return [];
    const q = testSearchQuery.toLowerCase().trim();
    const rows: Array<{
      facilityName: string;
      facilitySlug: string;
      facilityType: string;
      location: string;
      testName: string;
      testCode: string;
      category: string;
      price: number;
      discountPrice: number | null;
    }> = [];

    for (const f of facilities) {
      for (const t of f.testsPreview) {
        if (
          t.name.toLowerCase().includes(q) ||
          t.code.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        ) {
          rows.push({
            facilityName: f.name,
            facilitySlug: f.slug,
            facilityType: f.type,
            location: `${f.upazila.name}, ${f.upazila.district.name}`,
            testName: t.name,
            testCode: t.code,
            category: t.category,
            price: t.price,
            discountPrice: t.discountPrice,
          });
        }
      }
    }

    return rows.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  }, [facilities, testSearchQuery]);

  const selectCls =
    "w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500";

  return (
    <div className="space-y-8">
      {/* Directory Hero Banner */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-10 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 rounded-xl bg-teal-50 border border-teal-200 px-3 py-1 text-xs font-bold text-teal-900">
              <FlaskConical className="h-3.5 w-3.5 text-teal-700" />
              <span>National Healthcare & Diagnostics Directory</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Hospitals & Diagnostic Centers
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Explore accredited hospitals, 24/7 diagnostic labs, and clinics across Bangladesh. Compare diagnostic test pricing, find practicing specialist doctors, and check ambulance hotlines.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 shrink-0 lg:w-80 text-center">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3.5">
              <p className="text-2xl font-extrabold text-slate-900">{facilities.length}</p>
              <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide mt-0.5">
                Facilities
              </p>
            </div>
            <div className="rounded-2xl border border-teal-100 bg-teal-50/80 p-3.5">
              <p className="text-2xl font-extrabold text-teal-900">{totalTests || "500+"}</p>
              <p className="text-[11px] font-medium text-teal-700 uppercase tracking-wide mt-0.5">
                Lab Tests
              </p>
            </div>
            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3.5">
              <p className="text-2xl font-extrabold text-indigo-900">{totalDoctors}</p>
              <p className="text-[11px] font-medium text-indigo-700 uppercase tracking-wide mt-0.5">
                Doctors
              </p>
            </div>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex items-center gap-2 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "directory"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>Browse Hospitals & Centers ({facilities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("test-explorer")}
            className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === "test-explorer"
                ? "bg-teal-700 text-white shadow-xs"
                : "bg-teal-50 text-teal-900 hover:bg-teal-100"
            }`}
          >
            <FlaskConical className="h-4 w-4" />
            <span>Diagnostic Test Price Comparator (৳)</span>
          </button>
        </div>
      </div>

      {activeTab === "directory" ? (
        <>
          {/* Type Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {TYPE_FILTERS.map((tf) => {
              const Icon = tf.icon;
              const isSelected = selectedType === tf.id;
              const count =
                tf.id === "ALL"
                  ? facilities.length
                  : facilities.filter((f) => f.type === tf.id).length;

              return (
                <button
                  key={tf.id}
                  type="button"
                  onClick={() => setSelectedType(tf.id)}
                  className={`inline-flex items-center gap-1.5 shrink-0 rounded-2xl px-4 py-2 font-semibold transition cursor-pointer ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{tf.label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected ? "bg-indigo-700 text-white" : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search & Location Filters Grid */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search hospital by name, area, diagnostic test (e.g. MRI, CBC, USG), or hotline..."
                className="w-full rounded-2xl border border-slate-300 pl-10 pr-10 py-3 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Division
                </label>
                <select
                  value={selectedDivision}
                  onChange={(e) => {
                    setSelectedDivision(e.target.value);
                    setSelectedDistrict("ALL");
                    setSelectedUpazila("ALL");
                  }}
                  className={selectCls}
                >
                  <option value="ALL">All Divisions</option>
                  {divisions.map((d) => (
                    <option key={d.slug} value={d.slug}>
                      {d.name} Division
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  District
                </label>
                <select
                  value={selectedDistrict}
                  onChange={(e) => {
                    setSelectedDistrict(e.target.value);
                    setSelectedUpazila("ALL");
                  }}
                  disabled={availableDistricts.length === 0}
                  className={selectCls}
                >
                  <option value="ALL">All Districts</option>
                  {availableDistricts.map((dist) => (
                    <option key={dist.slug} value={dist.slug}>
                      {dist.name} District
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Upazila / Area
                </label>
                <select
                  value={selectedUpazila}
                  onChange={(e) => setSelectedUpazila(e.target.value)}
                  disabled={availableUpazilas.length === 0}
                  className={selectCls}
                >
                  <option value="ALL">All Upazilas / Thanas</option>
                  {availableUpazilas.map((u) => (
                    <option key={u.slug} value={u.slug}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className={selectCls}
                >
                  <option value="doctors">Most Practicing Doctors</option>
                  <option value="tests">Most Diagnostic Tests</option>
                  <option value="name">Name (Alphabetical A-Z)</option>
                </select>
              </div>
            </div>

            {(selectedDivision !== "ALL" ||
              selectedDistrict !== "ALL" ||
              selectedUpazila !== "ALL" ||
              searchQuery ||
              selectedType !== "ALL") && (
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                <span className="text-slate-500">
                  Showing <strong>{filteredFacilities.length}</strong> matching facilities
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDivision("ALL");
                    setSelectedDistrict("ALL");
                    setSelectedUpazila("ALL");
                    setSelectedType("ALL");
                    setSearchQuery("");
                  }}
                  className="font-bold text-rose-600 hover:text-rose-700 underline"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Facility Cards Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                Verified Medical Institutes & Labs ({filteredFacilities.length})
              </h2>
            </div>

            {filteredFacilities.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-3">
                <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
                <p className="text-base font-bold text-slate-800">No medical centers found.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Try adjusting your location filters or search query to see more facilities.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredFacilities.map((facility) => {
                  const isHospital = facility.type === "HOSPITAL";
                  const isDiagnostic = facility.type === "DIAGNOSTIC";

                  return (
                    <div
                      key={facility.id}
                      className="group flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition space-y-5"
                    >
                      <div className="space-y-3">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span
                            className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-0.5 text-[11px] font-bold ${
                              isHospital
                                ? "bg-blue-50 text-blue-700 border border-blue-200"
                                : isDiagnostic
                                ? "bg-teal-50 text-teal-700 border border-teal-200"
                                : "bg-purple-50 text-purple-700 border border-purple-200"
                            }`}
                          >
                            {isHospital ? (
                              <Hospital className="h-3 w-3" />
                            ) : isDiagnostic ? (
                              <FlaskConical className="h-3 w-3" />
                            ) : (
                              <Building2 className="h-3 w-3" />
                            )}
                            <span>{facility.type}</span>
                          </span>

                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            <ShieldCheck className="h-3 w-3" /> Verified Center
                          </span>
                        </div>

                        {/* Title, Logo & Location */}
                        <div className="flex items-start gap-3.5">
                          <FacilityLogo
                            src={facility.logo}
                            name={facility.name}
                            type={facility.type}
                            size="md"
                            shape="rounded"
                            className="shadow-2xs"
                          />
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/facility/${facility.slug}`}
                              className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition block truncate"
                              title={facility.name}
                            >
                              {facility.name}
                            </Link>
                            <p className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <span className="truncate">
                                {facility.upazila.name}, {facility.upazila.district.name}
                              </span>
                            </p>
                          </div>
                        </div>

                        {facility.address && (
                          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                            {facility.address}
                          </p>
                        )}

                        {/* Features / Counters */}
                        <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                            <span className="block text-sm font-extrabold text-slate-900">
                              {facility.doctorCount}
                            </span>
                            <span className="text-[11px] text-slate-500">Specialist Doctors</span>
                          </div>

                          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-2.5 text-center">
                            <span className="block text-sm font-extrabold text-teal-900">
                              {facility.testCount > 0 ? facility.testCount : "20+"} Tests
                            </span>
                            <span className="text-[11px] text-teal-700">Diagnostic Catalog</span>
                          </div>
                        </div>

                        {/* Diagnostic Tests Preview */}
                        {facility.testsPreview.length > 0 && (
                          <div className="space-y-1.5 pt-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Popular Tests & Pricing:
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {facility.testsPreview.slice(0, 3).map((t) => (
                                <span
                                  key={t.code}
                                  className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700"
                                >
                                  <span>{t.name.split("(")[0].trim()}</span>
                                  <strong className="font-bold text-slate-900">
                                    ৳{t.discountPrice || t.price}
                                  </strong>
                                </span>
                              ))}
                              {facility.testsPreview.length > 3 && (
                                <span className="inline-flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                                  +{facility.testsPreview.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                        {facility.phone ? (
                          <a
                            href={`tel:${facility.phone}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 transition"
                          >
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            <span>{facility.phone}</span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">24/7 Desk</span>
                        )}

                        <Link
                          href={`/facility/${facility.slug}`}
                          className="inline-flex items-center gap-1 rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-2xs"
                        >
                          <span>View Details & Tests</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      ) : (
        /* Test Price Comparator Sub-view */
        <div className="space-y-6">
          <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-sm space-y-4">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-teal-600" />
                Cross-Hospital Diagnostic Test Price Comparator
              </h2>
              <p className="text-xs text-slate-600">
                Type any medical test name (e.g. &quot;CBC&quot;, &quot;Lipid Profile&quot;, &quot;MRI&quot;, &quot;USG Abdomen&quot;, &quot;ECG&quot;, &quot;Thyroid&quot;, &quot;HbA1c&quot;) to compare prices and discounts across accredited hospitals and diagnostic centers in Bangladesh.
              </p>
            </div>

            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={testSearchQuery}
                onChange={(e) => setTestSearchQuery(e.target.value)}
                placeholder="Search diagnostic test (e.g. CBC, MRI Brain, Lipid Profile, Creatinine, Thyroid T3 T4 TSH)..."
                className="w-full rounded-2xl border border-slate-300 pl-10 pr-10 py-3 text-xs sm:text-sm focus:border-teal-500 focus:outline-none"
              />
              {testSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTestSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Quick Test Tags */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium shrink-0">Popular:</span>
              {["CBC", "Lipid Profile", "HbA1c", "MRI Brain", "USG Abdomen", "ECG", "Echocardiogram", "Endoscopy"].map(
                (qt) => (
                  <button
                    key={qt}
                    type="button"
                    onClick={() => setTestSearchQuery(qt)}
                    className="shrink-0 rounded-xl bg-teal-50 border border-teal-200 px-2.5 py-1 font-semibold text-teal-900 hover:bg-teal-100 transition cursor-pointer"
                  >
                    {qt}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Test Comparison Table */}
          <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {testComparisonList.length === 0 ? (
              <div className="p-12 text-center text-slate-500 space-y-2">
                <FlaskConical className="h-8 w-8 text-slate-300 mx-auto" />
                <p className="font-semibold text-slate-700">
                  {testSearchQuery
                    ? `No matching diagnostic tests found for "${testSearchQuery}".`
                    : "Search or click any quick test tag above to compare prices."}
                </p>
                <p className="text-xs text-slate-400">
                  All tests feature official patient rates in BDT ৳ with available discounts.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50 text-slate-600 font-semibold">
                      <th className="py-3 px-4">Test Name & Code</th>
                      <th className="py-3 px-4">Hospital / Diagnostic Center</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Official Rate (BDT)</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {testComparisonList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-bold text-slate-900 text-sm block">
                              {item.testName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {item.testCode} · {item.category}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-800">
                          {item.facilityName}
                        </td>

                        <td className="py-3.5 px-4 text-slate-600">
                          {item.location}
                        </td>

                        <td className="py-3.5 px-4">
                          {item.discountPrice ? (
                            <div>
                              <span className="text-slate-400 line-through text-[11px] mr-1.5">
                                ৳{item.price.toLocaleString()}
                              </span>
                              <span className="font-bold text-emerald-700 text-sm">
                                ৳{item.discountPrice.toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="font-bold text-slate-900 text-sm">
                              ৳{item.price.toLocaleString()}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <Link
                            href={`/facility/${item.facilitySlug}`}
                            className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-teal-700 transition"
                          >
                            <span>Book / View</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
