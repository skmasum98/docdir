"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  Stethoscope,
  Search,
  Clock,
  MapPin,
  Calendar,
  Building2,
  Award,
  ChevronRight,
  UserCheck,
  Filter,
} from "lucide-react";

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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>("ALL");

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
            className="w-full rounded-2xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:border-indigo-500 focus:outline-none bg-white shadow-2xs"
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

        {/* Specialty Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedSpecialty("ALL")}
            className={`shrink-0 rounded-xl px-3 py-1.5 font-medium transition ${
              selectedSpecialty === "ALL"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
            }`}
          >
            All Departments ({doctorFacilities.length})
          </button>

          {specialtiesList.map((spec) => {
            const isSelected = selectedSpecialty === spec;
            const count = specialtyCounts[spec];
            return (
              <button
                key={spec}
                type="button"
                onClick={() => setSelectedSpecialty(spec)}
                className={`shrink-0 rounded-xl px-3 py-1.5 font-medium transition ${
                  isSelected
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {spec} ({count})
              </button>
            );
          })}
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
        <div className="grid gap-4 sm:grid-cols-2">
          {filteredDoctors.map((df) => {
            const doc = df.doctor;
            return (
              <Link
                key={df.id}
                href={`/doctor/${doc.slug}`}
                className="group block rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 transition hover:border-indigo-300 hover:bg-indigo-50/20 hover:shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg mb-1.5">
                      <Stethoscope className="h-3 w-3" />
                      {doc.specialty?.name ?? "General Specialist"}
                    </span>
                    <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition text-base truncate">
                      {doc.fullName}
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
                  <p className="text-xs text-slate-700 font-medium line-clamp-1">
                    {doc.degrees}
                  </p>
                )}

                {doc.designation && (
                  <p className="text-xs text-slate-500 line-clamp-1">
                    {doc.designation}
                  </p>
                )}

                {doc.visitingHours && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{doc.visitingHours}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Practicing at this center
                  </span>
                  <span className="font-semibold text-indigo-600 group-hover:underline flex items-center gap-1 shrink-0">
                    View Profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
