"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  FlaskConical,
  Hospital,
  Home,
  MapPin,
  Phone,
  Pill,
  Search,
  ShieldCheck,
  Stethoscope,
  X,
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
] as const;

type SortOption = "doctors" | "tests" | "name";
type ActiveTab = "directory" | "test-explorer";

const selectCls =
  "w-full min-w-0 rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs font-medium text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 sm:text-sm";

const inputCls =
  "w-full min-w-0 rounded-2xl border border-slate-300 bg-white py-3 pl-10 pr-10 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:text-sm";

const scrollbarHide =
  "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

function getDisplayPrice(
  price: number,
  discountPrice: number | null
): number {
  return discountPrice ?? price;
}

function formatPrice(price: number): string {
  return price.toLocaleString("en-BD");
}

function getFacilityTypeLabel(type: string): string {
  switch (type) {
    case "HOSPITAL":
      return "Hospital";
    case "DIAGNOSTIC":
      return "Diagnostic Center";
    case "CLINIC":
      return "Clinic";
    case "PHARMACY":
      return "Pharmacy";
    case "CHAMBER":
      return "Doctor Chamber";
    default:
      return type;
  }
}

export function FacilitiesDirectoryView({
  facilities,
  divisions,
  totalDoctors,
  totalTests,
}: FacilitiesDirectoryViewProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>("directory");

  const [selectedType, setSelectedType] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedDivision, setSelectedDivision] = useState("ALL");
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedUpazila, setSelectedUpazila] = useState("ALL");

  const [sortBy, setSortBy] = useState<SortOption>("doctors");
  const [testSearchQuery, setTestSearchQuery] = useState("");

  /* -------------------------------------------------------------------------- */
  /* Location options                                                            */
  /* -------------------------------------------------------------------------- */

  const availableDistricts = useMemo(() => {
    if (selectedDivision === "ALL") {
      return divisions.flatMap((division) => division.districts);
    }

    const division = divisions.find(
      (item) => item.slug === selectedDivision
    );

    return division?.districts ?? [];
  }, [divisions, selectedDivision]);

  const availableUpazilas = useMemo(() => {
    if (selectedDistrict === "ALL") {
      return availableDistricts.flatMap((district) => district.upazilas);
    }

    const district = availableDistricts.find(
      (item) => item.slug === selectedDistrict
    );

    return district?.upazilas ?? [];
  }, [availableDistricts, selectedDistrict]);

  /* -------------------------------------------------------------------------- */
  /* Filtered facilities                                                         */
  /* -------------------------------------------------------------------------- */

  const filteredFacilities = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    const result = facilities.filter((facility) => {
      if (
        selectedType !== "ALL" &&
        facility.type !== selectedType
      ) {
        return false;
      }

      if (
        selectedDivision !== "ALL" &&
        facility.upazila.district.division.slug !== selectedDivision
      ) {
        return false;
      }

      if (
        selectedDistrict !== "ALL" &&
        facility.upazila.district.slug !== selectedDistrict
      ) {
        return false;
      }

      if (
        selectedUpazila !== "ALL" &&
        facility.upazila.slug !== selectedUpazila
      ) {
        return false;
      }

      if (query) {
        const searchableText = [
          facility.name,
          facility.address ?? "",
          facility.phone ?? "",
          facility.upazila.name,
          facility.upazila.district.name,
          facility.upazila.district.division.name,
          ...facility.testsPreview.flatMap((test) => [
            test.name,
            test.code,
            test.category,
          ]),
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });

    result.sort((a, b) => {
      if (sortBy === "doctors") {
        return b.doctorCount - a.doctorCount;
      }

      if (sortBy === "tests") {
        return b.testCount - a.testCount;
      }

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

  /* -------------------------------------------------------------------------- */
  /* Test price comparison                                                       */
  /* -------------------------------------------------------------------------- */

  const testComparisonList = useMemo(() => {
    const query = testSearchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

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

    for (const facility of facilities) {
      for (const test of facility.testsPreview) {
        const searchableText = [
          test.name,
          test.code,
          test.category,
        ]
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          continue;
        }

        rows.push({
          facilityName: facility.name,
          facilitySlug: facility.slug,
          facilityType: facility.type,
          location: `${facility.upazila.name}, ${facility.upazila.district.name}`,
          testName: test.name,
          testCode: test.code,
          category: test.category,
          price: test.price,
          discountPrice: test.discountPrice,
        });
      }
    }

    return rows.sort(
      (a, b) =>
        getDisplayPrice(a.price, a.discountPrice) -
        getDisplayPrice(b.price, b.discountPrice)
    );
  }, [facilities, testSearchQuery]);

  /* -------------------------------------------------------------------------- */
  /* Filter helpers                                                              */
  /* -------------------------------------------------------------------------- */

  const hasActiveFilters =
    selectedDivision !== "ALL" ||
    selectedDistrict !== "ALL" ||
    selectedUpazila !== "ALL" ||
    selectedType !== "ALL" ||
    Boolean(searchQuery.trim());

  const resetFilters = () => {
    setSelectedDivision("ALL");
    setSelectedDistrict("ALL");
    setSelectedUpazila("ALL");
    setSelectedType("ALL");
    setSearchQuery("");
  };

  const handleDivisionChange = (value: string) => {
    setSelectedDivision(value);
    setSelectedDistrict("ALL");
    setSelectedUpazila("ALL");
  };

  const handleDistrictChange = (value: string) => {
    setSelectedDistrict(value);
    setSelectedUpazila("ALL");
  };

  return (
    <div className="w-full min-w-0 space-y-6 sm:space-y-8">
      {/* ====================================================================== */}
      {/* HERO                                                                   */}
      {/* ====================================================================== */}

      <section className="w-full min-w-0 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm sm:p-6 lg:p-10">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Hero content */}
          <div className="min-w-0 max-w-2xl space-y-3">
            <div className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold text-teal-900">
              <FlaskConical className="h-3.5 w-3.5 shrink-0 text-teal-700" />
              <span className="truncate">
                National Healthcare & Diagnostics Directory
              </span>
            </div>

            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-3xl lg:text-4xl">
              Hospitals & Diagnostic Centers
            </h1>

            <p className="text-sm leading-relaxed text-slate-600">
              Explore accredited hospitals, 24/7 diagnostic labs, and clinics
              across Bangladesh. Compare diagnostic test pricing, find
              practicing specialist doctors, and check ambulance hotlines.
            </p>
          </div>

          {/* Metrics */}
          <div className="grid w-full grid-cols-3 gap-2 text-center sm:gap-3 lg:w-80 lg:shrink-0">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3 sm:p-3.5">
              <p className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                {facilities.length}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:text-[11px]">
                Facilities
              </p>
            </div>

            <div className="rounded-2xl border border-teal-100 bg-teal-50/80 p-3 sm:p-3.5">
              <p className="text-xl font-extrabold text-teal-900 sm:text-2xl">
                {totalTests || "500+"}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-700 sm:text-[11px]">
                Lab Tests
              </p>
            </div>

            <div className="rounded-2xl border border-indigo-100 bg-indigo-50/80 p-3 sm:p-3.5">
              <p className="text-xl font-extrabold text-indigo-900 sm:text-2xl">
                {totalDoctors}
              </p>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-indigo-700 sm:text-[11px]">
                Doctors
              </p>
            </div>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="mt-6 flex min-w-0 items-center gap-2 overflow-x-auto border-t border-slate-100 pt-4 pb-1">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === "directory"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
            aria-pressed={activeTab === "directory"}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            <span>Browse Centers ({facilities.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("test-explorer")}
            className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition sm:text-sm ${
              activeTab === "test-explorer"
                ? "bg-teal-700 text-white shadow-sm"
                : "bg-teal-50 text-teal-900 hover:bg-teal-100"
            }`}
            aria-pressed={activeTab === "test-explorer"}
          >
            <FlaskConical className="h-4 w-4 shrink-0" />
            <span>Test Price Comparator (৳)</span>
          </button>
        </div>
      </section>

      {/* ====================================================================== */}
      {/* DIRECTORY                                                              */}
      {/* ====================================================================== */}

      {activeTab === "directory" ? (
        <>
          {/* Type filters */}
          <div
            className={`flex min-w-0 items-center gap-2 overflow-x-auto pb-2 text-xs ${scrollbarHide}`}
          >
            {TYPE_FILTERS.map((filter) => {
              const Icon = filter.icon;
              const isSelected = selectedType === filter.id;

              const count =
                filter.id === "ALL"
                  ? facilities.length
                  : facilities.filter(
                      (facility) => facility.type === filter.id
                    ).length;

              return (
                <button
                  key={filter.id}
                  type="button"
                  onClick={() => setSelectedType(filter.id)}
                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-2xl px-4 py-2.5 font-semibold transition ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />

                  <span>{filter.label}</span>

                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] leading-none ${
                      isSelected
                        ? "bg-indigo-700 text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search + filters */}
          <section className="w-full min-w-0 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search hospital, area, test or hotline..."
                className={inputCls}
                aria-label="Search facilities"
              />

              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Location filters */}
            <div className="grid grid-cols-1 gap-3 pt-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="min-w-0">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Division
                </label>

                <select
                  value={selectedDivision}
                  onChange={(event) =>
                    handleDivisionChange(event.target.value)
                  }
                  className={selectCls}
                  aria-label="Filter by division"
                >
                  <option value="ALL">All Divisions</option>

                  {divisions.map((division) => (
                    <option key={division.slug} value={division.slug}>
                      {division.name} Division
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  District
                </label>

                <select
                  value={selectedDistrict}
                  onChange={(event) =>
                    handleDistrictChange(event.target.value)
                  }
                  disabled={availableDistricts.length === 0}
                  className={selectCls}
                  aria-label="Filter by district"
                >
                  <option value="ALL">All Districts</option>

                  {availableDistricts.map((district) => (
                    <option key={district.slug} value={district.slug}>
                      {district.name} District
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Upazila / Area
                </label>

                <select
                  value={selectedUpazila}
                  onChange={(event) =>
                    setSelectedUpazila(event.target.value)
                  }
                  disabled={availableUpazilas.length === 0}
                  className={selectCls}
                  aria-label="Filter by upazila"
                >
                  <option value="ALL">All Upazilas</option>

                  {availableUpazilas.map((upazila) => (
                    <option key={upazila.slug} value={upazila.slug}>
                      {upazila.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  Sort By
                </label>

                <select
                  value={sortBy}
                  onChange={(event) =>
                    setSortBy(event.target.value as SortOption)
                  }
                  className={selectCls}
                  aria-label="Sort facilities"
                >
                  <option value="doctors">Most Doctors</option>
                  <option value="tests">Most Tests</option>
                  <option value="name">Name (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Active filter summary */}
            {hasActiveFilters && (
              <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-3 text-xs sm:flex-row sm:items-center sm:justify-between">
                <span className="text-slate-500">
                  Showing{" "}
                  <strong className="text-slate-800">
                    {filteredFacilities.length}
                  </strong>{" "}
                  matching facilities
                </span>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="w-fit cursor-pointer font-bold text-rose-600 underline decoration-rose-200 underline-offset-2 transition hover:text-rose-700"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </section>

          {/* Facility results */}
          <section className="min-w-0 space-y-4">
            <div className="flex min-w-0 items-center justify-between gap-3">
              <h2 className="min-w-0 text-base font-bold text-slate-900 sm:text-lg">
                Verified Medical Institutes & Labs{" "}
                <span className="text-slate-400">
                  ({filteredFacilities.length})
                </span>
              </h2>
            </div>

            {filteredFacilities.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">
                <Building2 className="mx-auto h-10 w-10 text-slate-300" />

                <div className="mt-3 space-y-2">
                  <p className="text-base font-bold text-slate-800">
                    No medical centers found.
                  </p>

                  <p className="mx-auto max-w-sm text-xs leading-relaxed text-slate-500">
                    Try adjusting your location filters or search query to see
                    more facilities.
                  </p>
                </div>

                {hasActiveFilters && (
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 cursor-pointer rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {filteredFacilities.map((facility) => {
                  const isHospital = facility.type === "HOSPITAL";
                  const isDiagnostic = facility.type === "DIAGNOSTIC";

                  return (
                    <article
                      key={facility.id}
                      className="group flex min-w-0 h-full flex-col rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md sm:p-6"
                    >
                      {/* Card body */}
                      <div className="min-w-0 flex-1 space-y-3">
                        {/* Badges */}
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <span
                            className={`inline-flex min-w-0 shrink items-center gap-1 rounded-xl border px-2.5 py-1 text-[10px] font-bold sm:text-[11px] ${
                              isHospital
                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                : isDiagnostic
                                ? "border-teal-200 bg-teal-50 text-teal-700"
                                : "border-purple-200 bg-purple-50 text-purple-700"
                            }`}
                          >
                            {isHospital ? (
                              <Hospital className="h-3 w-3 shrink-0" />
                            ) : isDiagnostic ? (
                              <FlaskConical className="h-3 w-3 shrink-0" />
                            ) : (
                              <Building2 className="h-3 w-3 shrink-0" />
                            )}

                            <span className="truncate">
                              {getFacilityTypeLabel(facility.type)}
                            </span>
                          </span>

                          <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 sm:text-[11px]">
                            <ShieldCheck className="h-3 w-3 shrink-0" />
                            Verified
                          </span>
                        </div>

                        {/* Logo + title */}
                        <div className="flex min-w-0 items-start gap-3 sm:gap-3.5">
                          <FacilityLogo
                            src={facility.logo}
                            name={facility.name}
                            type={facility.type}
                            size="md"
                            shape="rounded"
                            className="shrink-0 shadow-sm"
                          />

                          <div className="min-w-0 flex-1">
                            <Link
                              href={`/facility/${facility.slug}`}
                              className="block line-clamp-2 text-base font-bold leading-snug text-slate-900 transition group-hover:text-indigo-600 sm:text-lg"
                              title={facility.name}
                            >
                              {facility.name}
                            </Link>

                            <p className="mt-1 flex min-w-0 items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                              <span className="truncate">
                                {facility.upazila.name},{" "}
                                {facility.upazila.district.name}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Address */}
                        {facility.address && (
                          <p className="min-w-0 line-clamp-2 rounded-xl border border-slate-100 bg-slate-50/70 p-2.5 text-xs leading-relaxed text-slate-600">
                            {facility.address}
                          </p>
                        )}

                        {/* Counters */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div className="rounded-xl border border-slate-100 bg-slate-50 p-2.5 text-center">
                            <span className="block text-sm font-extrabold text-slate-900">
                              {facility.doctorCount}
                            </span>

                            <span className="text-[11px] text-slate-500">
                              Doctors
                            </span>
                          </div>

                          <div className="rounded-xl border border-teal-100 bg-teal-50/60 p-2.5 text-center">
                            <span className="block text-sm font-extrabold text-teal-900">
                              {facility.testCount > 0
                                ? facility.testCount
                                : "20+"}
                            </span>

                            <span className="text-[11px] text-teal-700">
                              Lab Tests
                            </span>
                          </div>
                        </div>

                        {/* Tests preview */}
                        {facility.testsPreview.length > 0 && (
                          <div className="min-w-0 space-y-1.5 pt-1">
                            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                              Popular Tests
                            </p>

                            <div className="flex min-w-0 flex-wrap gap-1.5">
                              {facility.testsPreview
                                .slice(0, 3)
                                .map((test) => (
                                  <span
                                    key={test.code}
                                    title={test.name}
                                    className="inline-flex max-w-full min-w-0 items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] text-slate-700 sm:text-[11px]"
                                  >
                                    <span className="max-w-[150px] truncate">
                                      {test.name
                                        .split("(")[0]
                                        .trim()}
                                    </span>

                                    <strong className="shrink-0 font-bold text-slate-900">
                                      ৳
                                      {formatPrice(
                                        getDisplayPrice(
                                          test.price,
                                          test.discountPrice
                                        )
                                      )}
                                    </strong>
                                  </span>
                                ))}

                              {facility.testsPreview.length > 3 && (
                                <span className="inline-flex shrink-0 items-center rounded-md bg-indigo-50 px-1.5 py-1 text-[10px] font-bold text-indigo-600">
                                  +{facility.testsPreview.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Card footer */}
                      <div className="mt-auto flex min-w-0 items-center justify-between gap-2 border-t border-slate-100 pt-4">
                        {facility.phone ? (
                          <a
                            href={`tel:${facility.phone}`}
                            className="inline-flex min-w-0 max-w-[60%] items-center gap-1 truncate text-xs font-semibold text-slate-700 transition hover:text-slate-900"
                          >
                            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                            <span className="truncate">
                              {facility.phone}
                            </span>
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400">
                            24/7 Desk
                          </span>
                        )}

                        <Link
                          href={`/facility/${facility.slug}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-2xl bg-slate-900 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-slate-800 sm:px-4"
                        >
                          <span>View Details</span>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </>
      ) : (
        /* ==================================================================== */
        /* TEST PRICE COMPARATOR                                                */
        /* ==================================================================== */

        <section className="min-w-0 space-y-6">
          {/* Test search */}
          <div className="w-full min-w-0 rounded-3xl border border-teal-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="space-y-2">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900 sm:text-xl">
                <FlaskConical className="h-5 w-5 shrink-0 text-teal-600" />
                <span>Cross-Hospital Test Price Comparator</span>
              </h2>

              <p className="text-xs leading-relaxed text-slate-600">
                Search any medical test name such as CBC, Lipid Profile, MRI,
                USG Abdomen, ECG, Thyroid, or HbA1c to compare prices and
                discounts across hospitals and diagnostic centers.
              </p>
            </div>

            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                type="text"
                value={testSearchQuery}
                onChange={(event) =>
                  setTestSearchQuery(event.target.value)
                }
                placeholder="Search diagnostic test (e.g. CBC, MRI Brain)..."
                className={inputCls.replace(
                  "focus:border-indigo-500",
                  "focus:border-teal-500"
                )}
                aria-label="Search diagnostic tests"
              />

              {testSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTestSearchQuery("")}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Clear test search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Popular tests */}
            <div
              className={`mt-3 flex min-w-0 items-center gap-1.5 overflow-x-auto pb-1 text-xs ${scrollbarHide}`}
            >
              <span className="shrink-0 font-medium text-slate-400">
                Popular:
              </span>

              {[
                "CBC",
                "Lipid Profile",
                "HbA1c",
                "MRI Brain",
                "USG Abdomen",
                "ECG",
                "Echocardiogram",
                "Endoscopy",
              ].map((test) => (
                <button
                  key={test}
                  type="button"
                  onClick={() => setTestSearchQuery(test)}
                  className="shrink-0 cursor-pointer rounded-xl border border-teal-200 bg-teal-50 px-2.5 py-1.5 font-semibold text-teal-900 transition hover:bg-teal-100"
                >
                  {test}
                </button>
              ))}
            </div>
          </div>

          {/* Comparison results */}
          <div className="w-full min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            {testComparisonList.length === 0 ? (
              <div className="p-8 text-center sm:p-12">
                <FlaskConical className="mx-auto h-8 w-8 text-slate-300" />

                <p className="mt-3 font-semibold text-slate-700">
                  {testSearchQuery
                    ? `No matching diagnostic tests found for "${testSearchQuery}".`
                    : "Search or click any quick test tag above to compare prices."}
                </p>

                <p className="mt-2 text-xs leading-relaxed text-slate-400">
                  All tests feature official patient rates in BDT ৳ with
                  available discounts.
                </p>
              </div>
            ) : (
              <>
                {/* ============================================================ */}
                {/* Mobile result cards                                           */}
                {/* ============================================================ */}

                <div className="divide-y divide-slate-100 md:hidden">
                  {testComparisonList.map((item, index) => (
                    <div
                      key={`${item.facilitySlug}-${item.testCode}-${index}`}
                      className="min-w-0 space-y-3 p-4"
                    >
                      <div className="min-w-0">
                        <span className="block line-clamp-2 text-sm font-bold text-slate-900">
                          {item.testName}
                        </span>

                        <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">
                          {item.testCode} · {item.category}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-slate-800">
                          {item.facilityName}
                        </span>

                        <span className="block truncate text-xs text-slate-500">
                          {item.location}
                        </span>
                      </div>

                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <div className="min-w-0">
                          {item.discountPrice !== null ? (
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[11px] text-slate-400 line-through">
                                ৳{formatPrice(item.price)}
                              </span>

                              <span className="text-sm font-bold text-emerald-700">
                                ৳{formatPrice(item.discountPrice)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm font-bold text-slate-900">
                              ৳{formatPrice(item.price)}
                            </span>
                          )}
                        </div>

                        <Link
                          href={`/facility/${item.facilitySlug}`}
                          className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-teal-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-teal-700"
                        >
                          <span>View</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ============================================================ */}
                {/* Desktop table                                                 */}
                {/* ============================================================ */}

                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-slate-600">
                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          Test Name & Code
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          Hospital / Diagnostic Center
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          Location
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 font-semibold">
                          Official Rate (BDT)
                        </th>

                        <th className="whitespace-nowrap px-4 py-3 text-right font-semibold">
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {testComparisonList.map((item, index) => (
                        <tr
                          key={`${item.facilitySlug}-${item.testCode}-${index}`}
                          className="transition hover:bg-slate-50/60"
                        >
                          <td className="max-w-[250px] px-4 py-3.5">
                            <div className="min-w-0">
                              <span className="block truncate text-sm font-bold text-slate-900">
                                {item.testName}
                              </span>

                              <span className="mt-0.5 block truncate font-mono text-[10px] text-slate-400">
                                {item.testCode} · {item.category}
                              </span>
                            </div>
                          </td>

                          <td className="max-w-[220px] px-4 py-3.5">
                            <span className="block truncate font-semibold text-slate-800">
                              {item.facilityName}
                            </span>
                          </td>

                          <td className="max-w-[180px] px-4 py-3.5 text-slate-600">
                            <span className="block truncate">
                              {item.location}
                            </span>
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5">
                            {item.discountPrice !== null ? (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] text-slate-400 line-through">
                                  ৳{formatPrice(item.price)}
                                </span>

                                <span className="text-sm font-bold text-emerald-700">
                                  ৳{formatPrice(item.discountPrice)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm font-bold text-slate-900">
                                ৳{formatPrice(item.price)}
                              </span>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-4 py-3.5 text-right">
                            <Link
                              href={`/facility/${item.facilitySlug}`}
                              className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-teal-700"
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
              </>
            )}
          </div>
        </section>
      )}
    </div>
  );
}