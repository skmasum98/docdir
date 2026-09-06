"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Search,
  Clock,
  CalendarCheck,
  UserCheck,
} from "lucide-react";
import { UserAvatar } from "@/components/user-avatar";

interface DoctorAffiliation {
  id: number;
  doctor: {
    id: number;
    fullName: string;
    slug: string;
    degrees: string | null;
    designation: string | null;
    profilePhoto: string | null;
    consultationFee: number | null;
    visitingHours: string | null;
    specialty: {
      id: number;
      name: string;
      slug: string;
    } | null;
  };
}

interface FacilityCategorizedDoctorsProps {
  facilityName: string;
  doctorFacilities: DoctorAffiliation[];
}

export function FacilityCategorizedDoctors({
  facilityName,
  doctorFacilities,
}: FacilityCategorizedDoctorsProps) {
  const PAGE_SIZE = 50;
  const COLLAPSED_SPEC_COUNT = 6;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [showAllSpecs, setShowAllSpecs] = useState(false);

  // Extract unique specialties and their count
  const specialtyCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const df of doctorFacilities) {
      const spec = df.doctor.specialty?.name || "General Practitioner";
      counts[spec] = (counts[spec] || 0) + 1;
    }
    return counts;
  }, [doctorFacilities]);

  const specialtiesList = useMemo(() => {
    return Object.keys(specialtyCounts).sort();
  }, [specialtyCounts]);

  const filteredDoctors = useMemo(() => {
    return doctorFacilities.filter((df) => {
      const doc = df.doctor;
      const specName = doc.specialty?.name || "General Practitioner";

      const matchesSpecialty =
        selectedSpecialty === "ALL" || specName === selectedSpecialty;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.fullName.toLowerCase().includes(q) ||
        (doc.degrees && doc.degrees.toLowerCase().includes(q)) ||
        (doc.designation && doc.designation.toLowerCase().includes(q)) ||
        specName.toLowerCase().includes(q);

      return matchesSpecialty && matchesSearch;
    });
  }, [doctorFacilities, searchQuery, selectedSpecialty]);

  // Reset to first page whenever filters or data change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSpecialty, doctorFacilities]);

  // Collapse expanded list when facility data changes
  useEffect(() => {
    setShowAllSpecs(false);
  }, [doctorFacilities]);

  // Visible specialties: always include the selected one even when collapsed
  const visibleSpecs = useMemo(() => {
    if (showAllSpecs) return specialtiesList;
    if (
      selectedSpecialty !== "ALL" &&
      !specialtiesList.slice(0, COLLAPSED_SPEC_COUNT).includes(selectedSpecialty)
    ) {
      return [
        ...specialtiesList.slice(0, COLLAPSED_SPEC_COUNT - 1),
        selectedSpecialty,
      ];
    }
    return specialtiesList.slice(0, COLLAPSED_SPEC_COUNT);
  }, [specialtiesList, showAllSpecs, selectedSpecialty]);

  const totalPages = Math.max(1, Math.ceil(filteredDoctors.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedDoctors = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredDoctors.slice(start, start + PAGE_SIZE);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredDoctors, safePage]);

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-sm space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
              <Stethoscope className="h-4 w-4" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900">
              Specialist Doctors at {facilityName}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Categorized by medical department, consulting hours, and chamber fee structure.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 self-start md:self-auto shrink-0">
          <UserCheck className="h-4 w-4 text-slate-500" />
          {doctorFacilities.length} Doctors
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search doctors by name, degree, or specialty..."
            className="min-h-11 w-full rounded-2xl border border-slate-300 pl-10 pr-16 py-2.5 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none bg-white shadow-2xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 inline-flex min-h-8 -translate-y-1/2 items-center rounded-lg px-2.5 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Specialty filter — wrapped grid, no horizontal scroll.
            Native select for quick jump on mobile + expandable chips to see all. */}
        <div className="space-y-2">
          <label className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 text-xs font-semibold text-slate-700">
              Department:
            </span>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              aria-label="Filter by department"
              className="filter-select min-h-11 flex-1"
            >
              <option value="ALL">
                All Departments ({doctorFacilities.length})
              </option>
              {specialtiesList.map((spec) => (
                <option key={spec} value={spec}>
                  {spec} ({specialtyCounts[spec]})
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-wrap gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setSelectedSpecialty("ALL")}
              aria-pressed={selectedSpecialty === "ALL"}
              className={`inline-flex min-h-9 items-center rounded-xl px-3 py-1.5 font-medium transition ${
                selectedSpecialty === "ALL"
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              All ({doctorFacilities.length})
            </button>

            {visibleSpecs.map((spec) => {
              const isSelected = selectedSpecialty === spec;
              const count = specialtyCounts[spec];
              return (
                <button
                  key={spec}
                  type="button"
                  onClick={() => setSelectedSpecialty(spec)}
                  aria-pressed={isSelected}
                  title={`${spec} — ${count} doctor${count === 1 ? "" : "s"}`}
                  className={`inline-flex min-h-9 max-w-full items-center gap-1 rounded-xl px-3 py-1.5 font-medium transition ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <span className="max-w-36 truncate sm:max-w-48">{spec}</span>
                  <span className={isSelected ? "opacity-80" : "opacity-60"}>
                    ({count})
                  </span>
                </button>
              );
            })}

            {specialtiesList.length > COLLAPSED_SPEC_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllSpecs((v) => !v)}
                aria-expanded={showAllSpecs}
                className="inline-flex min-h-9 items-center gap-1 rounded-xl border border-slate-300 bg-white px-3 py-1.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                {showAllSpecs ? (
                  <>Show less ↑</>
                ) : (
                  <>+{specialtiesList.length - visibleSpecs.length} more ↓</>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Doctor Cards */}
      {filteredDoctors.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
          No doctors found for &quot;{searchQuery}&quot; in the selected specialty.
          <div className="mt-2">
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedSpecialty("ALL");
              }}
              className="font-semibold text-indigo-600 underline"
            >
              Show all doctors
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs font-medium text-slate-500">
            Showing{" "}
            {filteredDoctors.length > 0
              ? `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filteredDoctors.length)}`
              : "0"}{" "}
            of {filteredDoctors.length} doctor{filteredDoctors.length === 1 ? "" : "s"}
            {totalPages > 1 && ` • Page ${safePage} of ${totalPages}`}
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            {paginatedDoctors.map((df, i) => {
              const doc = df.doctor;
              return (
                <article
                  key={df.id}
                  style={{ animationDelay: `${Math.min(i, 11) * 45}ms` }}
                  className="group min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md animate-card-enter sm:p-5"
                >
                  {/* Avatar + name + fee */}
                  <div className="flex min-w-0 items-start gap-3">
                    <Link
                      href={`/doctor/${doc.slug}`}
                      aria-label={`View ${doc.fullName}'s profile`}
                      className="shrink-0 rounded-2xl transition-transform duration-200 hover:scale-105"
                    >
                      <UserAvatar
                        src={doc.profilePhoto}
                        name={doc.fullName}
                        size="lg"
                        className="shadow-sm ring-2 ring-slate-100 transition group-hover:ring-indigo-200"
                      />
                    </Link>
                    <div className="min-w-0 flex-1">
                      <span className="inline-flex max-w-full items-center gap-1 truncate text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg">
                        <Stethoscope className="h-3 w-3 shrink-0" />
                        <span className="truncate">
                          {doc.specialty?.name ?? "General Specialist"}
                        </span>
                      </span>
                      <h3 className="mt-1 break-words font-bold text-slate-900 transition-colors group-hover:text-indigo-600 text-base leading-snug">
                        <Link href={`/doctor/${doc.slug}`}>
                          {doc.fullName}
                        </Link>
                      </h3>
                    </div>

                    {doc.consultationFee ? (
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-slate-500 block uppercase tracking-wide">
                          Fee
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          ৳{doc.consultationFee.toLocaleString()}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {doc.degrees && (
                    <p className="mt-2.5 truncate text-xs text-slate-700 font-medium">
                      {doc.degrees}
                    </p>
                  )}

                  {doc.designation && (
                    <p className="truncate text-xs text-slate-500">
                      {doc.designation}
                    </p>
                  )}

                  {doc.visitingHours && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <Clock className="mt-0.5 h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="min-w-0 break-words">{doc.visitingHours}</span>
                    </div>
                  )}

                  {/* Actions — profile + book serial */}
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <Link
                      href={`/doctor/${doc.slug}`}
                      className="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-[0.98]"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/doctor/${doc.slug}`}
                      className="inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 text-xs font-bold text-white transition hover:bg-indigo-700 active:scale-[0.98]"
                    >
                      <CalendarCheck className="h-3.5 w-3.5 shrink-0" />
                      Book Serial
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Pagination — 50 doctors per page */}
          {totalPages > 1 && (
            <nav
              aria-label="Facility doctors pagination"
              className="flex min-h-12 flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-slate-50/60 p-3"
            >
              <button
                type="button"
                disabled={safePage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                ← Prev
              </button>
              <div className="flex flex-wrap items-center justify-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  // Compact page numbers: first, last, current ±1
                  if (
                    totalPages > 7 &&
                    page !== 1 &&
                    page !== totalPages &&
                    Math.abs(page - safePage) > 1
                  ) {
                    if (
                      page === 2 ||
                      page === totalPages - 1 ||
                      (page === safePage - 2 && safePage > 3) ||
                      (page === safePage + 2 && safePage < totalPages - 2)
                    ) {
                      return (
                        <span key={page} className="px-1 text-xs text-slate-400">
                          …
                        </span>
                      );
                    }
                    return null;
                  }
                  return (
                    <button
                      key={page}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                      aria-current={page === safePage ? "page" : undefined}
                      className={`inline-flex min-h-10 min-w-10 items-center justify-center rounded-xl px-2.5 text-xs font-semibold transition ${
                        page === safePage
                          ? "bg-slate-950 text-white"
                          : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                disabled={safePage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-300 bg-white px-4 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40"
              >
                Next →
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
