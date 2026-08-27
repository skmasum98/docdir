"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Tag,
  Clock,
  FlaskConical,
  Sparkles,
  HelpCircle,
  Phone,
  MessageSquare,
  Home,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { type CatalogItemTemplate } from "@/lib/diagnostic-tests-data";

export type TestCatalogItem = {
  id: number | string;
  code: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number | null;
  sampleType?: string | null;
  deliveryTime?: string | null;
  preparation?: string | null;
  homeSampleAvailable?: boolean;
  description?: string | null;
};

interface FacilityTestCatalogProps {
  facilityName: string;
  facilityPhone?: string | null;
  facilityType: string;
  tests?: TestCatalogItem[];
}

export function FacilityTestCatalog({
  facilityName,
  facilityPhone,
  facilityType,
  tests,
}: FacilityTestCatalogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");
  const [expandedTestId, setExpandedTestId] = useState<string | number | null>(null);

  const activeCatalog: TestCatalogItem[] = useMemo(() => {
    return tests || [];
  }, [tests]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const t of activeCatalog) {
      if (t.category) set.add(t.category);
    }
    return ["All Categories", ...Array.from(set).sort()];
  }, [activeCatalog]);

  const filteredTests = useMemo(() => {
    return activeCatalog.filter((test) => {
      const matchesCategory =
        selectedCategory === "All Categories" || test.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q) ||
        test.category.toLowerCase().includes(q) ||
        (test.description && test.description.toLowerCase().includes(q));

      return matchesCategory && matchesSearch;
    });
  }, [activeCatalog, searchQuery, selectedCategory]);

  if (!tests || tests.length === 0) {
    return null; // Do not render if facility hasn't added any tests/services
  }

  function getWhatsAppUrl(test: TestCatalogItem) {
    const effectivePrice = test.discountPrice || test.price;
    const text = encodeURIComponent(
      `Hello ${facilityName},\nI would like to inquire about/book the diagnostic test:\n- *${test.name}* (${test.code})\n- Price: ৳${effectivePrice}\nCould you please let me know current availability and reporting times?`
    );
    const phone = facilityPhone ? facilityPhone.replace(/[^0-9]/g, "") : "8801700000000";
    const cleanPhone = phone.startsWith("88") ? phone : `88${phone}`;
    return `https://wa.me/${cleanPhone}?text=${text}`;
  }

  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <FlaskConical className="h-4 w-4" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Diagnostic & Pathology Test Facility
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official test catalog, patient pricing (BDT ৳), delivery turnaround times, and sample preparation guidelines.
          </p>
        </div>

        {facilityPhone && (
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${facilityPhone}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Phone className="h-3.5 w-3.5 text-slate-500" />
              <span>Lab Hotline: {facilityPhone}</span>
            </a>
          </div>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search diagnostic test (e.g. CBC, MRI Brain, Lipid Profile, Thyroid, USG Abdomen, HbA1c)..."
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

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`shrink-0 rounded-xl px-3 py-1.5 font-medium transition ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tests Count summary */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>
          Showing <strong>{filteredTests.length}</strong> available diagnostic & lab test{filteredTests.length === 1 ? "" : "s"}
        </span>
        <span className="hidden sm:inline-flex items-center gap-1 text-emerald-700">
          <ShieldCheck className="h-3.5 w-3.5" /> ISO / Automated Lab Testing
        </span>
      </div>

      {/* Test List Grid */}
      <div className="space-y-3">
        {filteredTests.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            No diagnostic tests matching &quot;{searchQuery}&quot; in {selectedCategory}.
            <div className="mt-2">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                }}
                className="font-semibold text-indigo-600 underline"
              >
                Reset filters
              </button>
            </div>
          </div>
        ) : (
          filteredTests.map((test) => {
            const isExpanded = expandedTestId === test.id;
            return (
              <div
                key={test.id}
                className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 transition hover:border-slate-300 hover:shadow-2xs space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                        {test.code}
                      </span>
                      <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                        {test.category}
                      </span>
                      {test.homeSampleAvailable && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                          <Home className="h-3 w-3" /> Home Sample Available
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-bold text-slate-900 pt-0.5">
                      {test.name}
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {test.description}
                    </p>
                  </div>

                  {/* Pricing Box */}
                  <div className="flex sm:flex-col items-baseline sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100 shrink-0">
                    <div className="text-right">
                      {test.discountPrice ? (
                        <div className="flex sm:flex-col items-baseline sm:items-end gap-1.5">
                          <span className="text-xs text-slate-400 line-through">
                            ৳{test.price.toLocaleString()}
                          </span>
                          <span className="text-lg font-extrabold text-slate-900">
                            ৳{test.discountPrice.toLocaleString()}
                          </span>
                        </div>
                      ) : (
                        <span className="text-lg font-extrabold text-slate-900">
                          ৳{test.price.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                      <Clock className="h-3 w-3 text-slate-400" /> {test.deliveryTime}
                    </span>
                  </div>
                </div>

                {/* Preparation & Actions Bar */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setExpandedTestId(isExpanded ? null : test.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
                  >
                    <Info className="h-3.5 w-3.5 text-slate-400" />
                    <span>Patient Preparation & Sample Info</span>
                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <a
                      href={getWhatsAppUrl(test)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-emerald-700 transition"
                    >
                      <MessageSquare className="h-3.5 w-3.5" /> Inquire via WhatsApp
                    </a>

                    {facilityPhone && (
                      <a
                        href={`tel:${facilityPhone}`}
                        className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-slate-700 hover:bg-slate-100"
                        title="Call Laboratory Desk"
                      >
                        <Phone className="h-3.5 w-3.5" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Expanded Preparation Instructions */}
                {isExpanded && (
                  <div className="rounded-xl bg-slate-50 p-3.5 border border-slate-100 space-y-2 text-xs animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">
                          Sample & Modality:
                        </span>
                        <span className="text-slate-600">{test.sampleType}</span>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 block mb-0.5">
                          Report Turnaround Time:
                        </span>
                        <span className="text-slate-600">{test.deliveryTime}</span>
                      </div>
                    </div>
                    <div>
                      <span className="font-bold text-slate-700 block mb-0.5">
                        Patient Preparation Instructions:
                      </span>
                      <p className="text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/80 leading-relaxed font-medium">
                        {test.preparation}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Home Sample Collection Banner */}
      <div className="rounded-2xl border border-indigo-100 bg-linear-to-r from-indigo-50/80 to-blue-50/50 p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <Home className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
              Need Home Pathology Sample Collection?
            </h4>
            <p className="text-[11px] text-indigo-900/80 mt-0.5">
              Trained phlebotomists can collect blood and urine samples from your residence in this district.
            </p>
          </div>
        </div>
        <a
          href={
            facilityPhone
              ? `tel:${facilityPhone}`
              : "https://wa.me/8801700000000?text=Hello,%20I%20would%20like%20to%20request%20Home%20Sample%20Collection"
          }
          className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition shadow-xs"
        >
          Book Home Sample Collection →
        </a>
      </div>
    </div>
  );
}
