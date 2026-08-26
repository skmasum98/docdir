"use client";

import { useState, useEffect, useRef } from "react";
import {
  Building2,
  Search,
  Plus,
  X,
  Check,
  MapPin,
  Loader2,
  Stethoscope,
  Sparkles,
  Home,
  Pill,
  Hospital,
} from "lucide-react";
import { FacilityType } from "@/lib/enums";

export type FacilityItem = {
  id: number;
  name: string;
  type: string;
  address?: string | null;
  phone?: string | null;
  location?: string | null;
  upazilaName?: string;
  districtName?: string;
};

interface FacilitySearchPickerProps {
  initialFacilities?: FacilityItem[];
  label?: string;
  subLabel?: string;
  onApplyAsChamber?: (facility: FacilityItem) => void;
}

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
    label: "Doctor's Chamber",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Home,
  },
};

export function FacilitySearchPicker({
  initialFacilities = [],
  label = "Affiliated Hospitals, Diagnostic Centers & Chambers",
  subLabel = "Search and link the medical facilities where you practice or consult patients.",
  onApplyAsChamber,
}: FacilitySearchPickerProps) {
  const [selected, setSelected] = useState<FacilityItem[]>(initialFacilities);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [results, setResults] = useState<FacilityItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch facilities when query or typeFilter changes
  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (query.trim()) params.set("q", query.trim());
        if (typeFilter !== "ALL") params.set("type", typeFilter);
        params.set("limit", "15");

        const res = await fetch(`/api/facilities/search?${params.toString()}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (active && data.facilities) {
          setResults(data.facilities);
        }
      } catch (err) {
        if (active) setResults([]);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 200);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, typeFilter]);

  const handleSelect = (facility: FacilityItem) => {
    if (!selected.some((f) => f.id === facility.id)) {
      setSelected((prev) => [...prev, facility]);
    }
    setIsOpen(false);
    setQuery("");
  };

  const handleRemove = (facilityId: number) => {
    setSelected((prev) => prev.filter((f) => f.id !== facilityId));
  };

  const getTypeBadge = (type: string) => {
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
        className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-[11px] font-semibold ${config.bg} ${config.text} ${config.border}`}
      >
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Hidden inputs to pass facilityIds into the FormData submission */}
      <input type="hidden" name="facilityIdsUpdated" value="true" />
      {selected.map((f) => (
        <input key={f.id} type="hidden" name="facilityIds" value={f.id} />
      ))}

      <div>
        <label className="block text-sm font-semibold text-slate-800">{label}</label>
        {subLabel && <p className="text-xs text-slate-500 mt-0.5">{subLabel}</p>}
      </div>

      {/* Facility Search Input with Filter & Dropdown */}
      <div ref={containerRef} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => setIsOpen(true)}
              placeholder="Search diagnostic centers, hospitals, clinics, chambers by name or location..."
              className="w-full rounded-2xl border border-slate-300 bg-white py-2.5 pl-10 pr-10 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 placeholder:text-slate-400"
            />
            {isLoading && (
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setIsOpen(true);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("HOSPITAL");
                setIsOpen(true);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === "HOSPITAL"
                  ? "bg-blue-600 text-white"
                  : "bg-blue-50 text-blue-700 hover:bg-blue-100"
              }`}
            >
              Hospitals
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("DIAGNOSTIC");
                setIsOpen(true);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === "DIAGNOSTIC"
                  ? "bg-teal-600 text-white"
                  : "bg-teal-50 text-teal-700 hover:bg-teal-100"
              }`}
            >
              Diagnostics
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("CLINIC");
                setIsOpen(true);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === "CLINIC"
                  ? "bg-amber-600 text-white"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              Clinics
            </button>
            <button
              type="button"
              onClick={() => {
                setTypeFilter("CHAMBER");
                setIsOpen(true);
              }}
              className={`rounded-xl px-3 py-2 text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                typeFilter === "CHAMBER"
                  ? "bg-purple-600 text-white"
                  : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              Chambers
            </button>
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-30 mt-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-xl ring-1 ring-black/5">
            {isLoading ? (
              <div className="flex items-center justify-center py-6 text-xs text-slate-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching facilities...
              </div>
            ) : results.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                <Building2 className="mx-auto h-6 w-6 text-slate-300 mb-1" />
                No matching facilities found. Try changing your search query or type filter.
              </div>
            ) : (
              <ul className="space-y-1">
                {results.map((facility) => {
                  const isSelected = selected.some((f) => f.id === facility.id);
                  return (
                    <li
                      key={facility.id}
                      onClick={() => !isSelected && handleSelect(facility)}
                      className={`flex items-center justify-between gap-3 rounded-xl p-2.5 transition text-xs ${
                        isSelected
                          ? "bg-slate-50 opacity-60 cursor-default"
                          : "hover:bg-indigo-50/70 cursor-pointer"
                      }`}
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 truncate">
                            {facility.name}
                          </span>
                          {getTypeBadge(facility.type)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          {facility.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {facility.location}
                            </span>
                          )}
                          {facility.phone && (
                            <span className="shrink-0 text-slate-400">· {facility.phone}</span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-800">
                            <Check className="h-3 w-3" /> Added
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
                          >
                            <Plus className="h-3 w-3" /> Add
                          </button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Selected Facilities List */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
            Selected Affiliations ({selected.length})
          </span>
          {selected.length > 0 && (
            <span className="text-[11px] text-slate-400">
              Attached to your doctor profile and shown to patients
            </span>
          )}
        </div>

        {selected.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-5 text-center text-xs text-slate-500 bg-slate-50/50">
            No hospital or diagnostic facilities attached yet. Search above to link your practice centers.
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {selected.map((facility) => (
              <div
                key={facility.id}
                className="relative rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex flex-col justify-between gap-3 group hover:border-slate-300 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <p className="font-semibold text-slate-900 text-sm">{facility.name}</p>
                      {getTypeBadge(facility.type)}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(facility.id)}
                      className="rounded-lg p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                      title="Remove facility"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {(facility.address || facility.location) && (
                    <p className="mt-2 text-xs text-slate-600 flex items-start gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>{facility.address || facility.location}</span>
                    </p>
                  )}
                </div>

                {onApplyAsChamber && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => onApplyAsChamber(facility)}
                      className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Use as Chamber Address & Name
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
