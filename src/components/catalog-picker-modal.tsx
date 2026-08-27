"use client";

import { useState, useMemo } from "react";
import {
  Search,
  Check,
  Plus,
  FlaskConical,
  Activity,
  HeartPulse,
  Ambulance,
  Pill,
  Syringe,
  Sparkles,
  ShieldCheck,
  X,
  CheckSquare,
  Square,
  Tag,
  Loader2,
  DollarSign,
  Info,
} from "lucide-react";
import {
  ALL_CATALOG_TEMPLATES,
  DEFAULT_CLINICAL_SERVICES,
  DEFAULT_DIAGNOSTIC_TESTS,
  type CatalogItemTemplate,
} from "@/lib/diagnostic-tests-data";

interface CatalogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilityId: number;
  facilityName: string;
  existingCodes: Set<string>;
  onImportSuccess: (count: number) => void;
  importAction: (
    facilityId: number,
    items: Array<{
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
      isActive?: boolean;
    }>
  ) => Promise<{ ok: boolean; message: string; count?: number }>;
}

export function CatalogPickerModal({
  isOpen,
  onClose,
  facilityId,
  facilityName,
  existingCodes,
  onImportSuccess,
  importAction,
}: CatalogPickerModalProps) {
  const [activeTab, setActiveTab] = useState<"ALL" | "SERVICES" | "TESTS">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories");

  // Selected items with customized pricing
  // Map of code -> { item: CatalogItemTemplate, customPrice: number, customDiscount?: number, isChecked: boolean }
  const [customPricing, setCustomPricing] = useState<
    Record<
      string,
      {
        customPrice: number;
        customDiscount?: number | "";
        isChecked: boolean;
      }
    >
  >(() => {
    const init: Record<string, { customPrice: number; customDiscount?: number | ""; isChecked: boolean }> = {};
    for (const item of ALL_CATALOG_TEMPLATES) {
      init[item.code] = {
        customPrice: item.defaultPrice,
        customDiscount: item.defaultDiscountPrice || "",
        isChecked: false,
      };
    }
    return init;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return ALL_CATALOG_TEMPLATES.filter((item) => {
      if (activeTab === "SERVICES" && item.type !== "CLINICAL_SERVICE") return false;
      if (activeTab === "TESTS" && item.type !== "DIAGNOSTIC_TEST") return false;

      if (selectedCategory !== "All Categories" && item.category !== selectedCategory) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name.toLowerCase().includes(q);
        const matchCode = item.code.toLowerCase().includes(q);
        const matchCat = item.category.toLowerCase().includes(q);
        const matchDesc = (item.description || "").toLowerCase().includes(q);
        if (!matchName && !matchCode && !matchCat && !matchDesc) return false;
      }

      return true;
    });
  }, [activeTab, selectedCategory, searchQuery]);

  // Categories list based on current active tab
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    const pool =
      activeTab === "SERVICES"
        ? DEFAULT_CLINICAL_SERVICES
        : activeTab === "TESTS"
        ? DEFAULT_DIAGNOSTIC_TESTS
        : ALL_CATALOG_TEMPLATES;

    for (const item of pool) {
      if (item.category) set.add(item.category);
    }
    return ["All Categories", ...Array.from(set).sort()];
  }, [activeTab]);

  const selectedCount = useMemo(() => {
    return Object.values(customPricing).filter((v) => v.isChecked).length;
  }, [customPricing]);

  const handleToggleItem = (code: string) => {
    setCustomPricing((prev) => {
      const current = prev[code] || { customPrice: 0, isChecked: false };
      return {
        ...prev,
        [code]: {
          ...current,
          isChecked: !current.isChecked,
        },
      };
    });
  };

  const handlePriceChange = (code: string, newPrice: number) => {
    setCustomPricing((prev) => {
      const current = prev[code] || { customPrice: 0, isChecked: false };
      return {
        ...prev,
        [code]: {
          ...current,
          customPrice: Math.max(0, newPrice),
        },
      };
    });
  };

  const handleDiscountChange = (code: string, newDiscount: number | "") => {
    setCustomPricing((prev) => {
      const current = prev[code] || { customPrice: 0, isChecked: false };
      return {
        ...prev,
        [code]: {
          ...current,
          customDiscount: newDiscount === "" ? "" : Math.max(0, Number(newDiscount)),
        },
      };
    });
  };

  const handleSelectAllVisible = () => {
    setCustomPricing((prev) => {
      const next = { ...prev };
      for (const item of filteredTemplates) {
        if (!next[item.code]) {
          next[item.code] = {
            customPrice: item.defaultPrice,
            customDiscount: item.defaultDiscountPrice || "",
            isChecked: true,
          };
        } else {
          next[item.code] = {
            ...next[item.code],
            isChecked: true,
          };
        }
      }
      return next;
    });
  };

  const handleDeselectAll = () => {
    setCustomPricing((prev) => {
      const next = { ...prev };
      for (const code of Object.keys(next)) {
        next[code] = {
          ...next[code],
          isChecked: false,
        };
      }
      return next;
    });
  };

  const handleApplyGlobalMarkupDiscount = (percentChange: number) => {
    // e.g. +10% price markup or -10% discount across selected items
    setCustomPricing((prev) => {
      const next = { ...prev };
      for (const item of ALL_CATALOG_TEMPLATES) {
        if (next[item.code]?.isChecked) {
          const base = item.defaultPrice;
          const adjusted = Math.round(base * (1 + percentChange / 100));
          next[item.code] = {
            ...next[item.code],
            customPrice: Math.max(0, adjusted),
          };
        }
      }
      return next;
    });
  };

  const handleSaveToFacility = async () => {
    const itemsToAdd = ALL_CATALOG_TEMPLATES.filter(
      (item) => customPricing[item.code]?.isChecked
    ).map((item) => {
      const pricing = customPricing[item.code];
      const p = pricing?.customPrice ?? item.defaultPrice;
      const d =
        pricing?.customDiscount !== undefined && pricing.customDiscount !== ""
          ? Number(pricing.customDiscount)
          : null;

      return {
        code: item.code,
        name: item.name,
        category: item.category,
        price: p,
        discountPrice: d,
        sampleType: item.sampleType || null,
        deliveryTime: item.deliveryTime || null,
        preparation: item.preparation || null,
        homeSampleAvailable: item.homeSampleAvailable ?? false,
        description: item.description || null,
        isActive: true,
      };
    });

    if (itemsToAdd.length === 0) {
      setStatusMessage({ type: "error", text: "Please check at least one service or diagnostic test to add." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await importAction(facilityId, itemsToAdd);
      if (res.ok) {
        setStatusMessage({ type: "success", text: res.message });
        onImportSuccess(res.count || itemsToAdd.length);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setStatusMessage({ type: "error", text: res.message || "Failed to add items." });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message || "An unexpected error occurred." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getItemIcon = (item: CatalogItemTemplate) => {
    if (item.type === "CLINICAL_SERVICE") {
      switch (item.iconName) {
        case "HeartPulse":
          return <HeartPulse className="h-4 w-4 text-rose-600" />;
        case "Activity":
          return <Activity className="h-4 w-4 text-teal-600" />;
        case "Ambulance":
          return <Ambulance className="h-4 w-4 text-blue-600" />;
        case "Pill":
          return <Pill className="h-4 w-4 text-emerald-600" />;
        case "Syringe":
          return <Syringe className="h-4 w-4 text-purple-600" />;
        default:
          return <ShieldCheck className="h-4 w-4 text-indigo-600" />;
      }
    } else {
      switch (item.category) {
        case "Pathology & Blood Tests":
          return <FlaskConical className="h-4 w-4 text-teal-600" />;
        case "Radiology & Imaging":
          return <Sparkles className="h-4 w-4 text-purple-600" />;
        case "Cardiology & Heart":
          return <HeartPulse className="h-4 w-4 text-rose-600" />;
        case "Ultrasound (USG)":
          return <Activity className="h-4 w-4 text-indigo-600" />;
        default:
          return <FlaskConical className="h-4 w-4 text-teal-600" />;
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 sm:p-6 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl rounded-3xl border border-slate-200 bg-white shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-6 py-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-teal-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Pre-built Clinical Services & Diagnostic Tests Library
              </h2>
              <p className="text-xs text-slate-500">
                Pick items from master catalog, customize specific pricing (৳) for <strong>{facilityName}</strong>, and enable instantly.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl p-2 text-slate-400 hover:bg-slate-200/60 hover:text-slate-700 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab & Filter Bar */}
        <div className="border-b border-slate-100 p-4 sm:p-5 space-y-3 bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Type Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ALL");
                  setSelectedCategory("All Categories");
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  activeTab === "ALL"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                All Master Items ({ALL_CATALOG_TEMPLATES.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("SERVICES");
                  setSelectedCategory("All Categories");
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "SERVICES"
                    ? "bg-teal-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Clinical Services ({DEFAULT_CLINICAL_SERVICES.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("TESTS");
                  setSelectedCategory("All Categories");
                }}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "TESTS"
                    ? "bg-indigo-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                <span>Diagnostic Tests ({DEFAULT_DIAGNOSTIC_TESTS.length})</span>
              </button>
            </div>

            {/* Quick Bulk Selection Tools */}
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={handleSelectAllVisible}
                className="rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-semibold text-slate-700 hover:bg-slate-100 transition"
              >
                Select Filtered ({filteredTemplates.length})
              </button>
              {selectedCount > 0 && (
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 font-semibold text-rose-700 hover:bg-rose-100 transition"
                >
                  Clear Selection
                </button>
              )}
            </div>
          </div>

          {/* Search & Category Dropdown */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by test/service name (e.g. ICU, MRI, CBC, Dialysis, Lipid)..."
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/50 py-2 pl-9 pr-4 text-xs sm:text-sm focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full sm:w-64 rounded-2xl border border-slate-300 bg-white py-2 px-3 text-xs sm:text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Pricing Adjuster Toolbar (When items selected) */}
        {selectedCount > 0 && (
          <div className="bg-teal-50/70 border-b border-teal-100 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
            <div className="flex items-center gap-2 text-teal-900 font-semibold">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-600 text-white text-[10px] font-bold">
                {selectedCount}
              </span>
              <span>items selected for adding / updating.</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-teal-800 font-medium">Quick Pricing Preset:</span>
              <button
                type="button"
                onClick={() => handleApplyGlobalMarkupDiscount(10)}
                className="rounded-lg bg-white border border-teal-200 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100 transition"
                title="Increase price by +10% across selected"
              >
                +10%
              </button>
              <button
                type="button"
                onClick={() => handleApplyGlobalMarkupDiscount(-10)}
                className="rounded-lg bg-white border border-teal-200 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100 transition"
                title="Apply 10% discount on prices"
              >
                -10%
              </button>
              <button
                type="button"
                onClick={() => handleApplyGlobalMarkupDiscount(0)}
                className="rounded-lg bg-white border border-teal-200 px-2 py-1 text-[11px] font-bold text-teal-800 hover:bg-teal-100 transition"
                title="Reset to default master prices"
              >
                Reset Standard
              </button>
            </div>
          </div>
        )}

        {/* Messages */}
        {statusMessage && (
          <div
            className={`px-6 py-3 text-xs font-semibold shrink-0 ${
              statusMessage.type === "success"
                ? "bg-emerald-50 text-emerald-900 border-b border-emerald-200"
                : "bg-rose-50 text-rose-900 border-b border-rose-200"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {/* Item List Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 space-y-3">
          {filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-500 space-y-2">
              <Info className="h-6 w-6 text-slate-400 mx-auto" />
              <p>No template items found matching your filters.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedCategory("All Categories");
                  setActiveTab("ALL");
                }}
                className="font-bold text-teal-600 underline"
              >
                Reset all filters
              </button>
            </div>
          ) : (
            filteredTemplates.map((item) => {
              const pricing = customPricing[item.code] || {
                customPrice: item.defaultPrice,
                customDiscount: item.defaultDiscountPrice || "",
                isChecked: false,
              };
              const isChecked = pricing.isChecked;
              const alreadyExists = existingCodes.has(item.code);

              return (
                <div
                  key={item.id}
                  className={`pt-3 first:pt-0 rounded-2xl p-3 sm:p-4 transition border ${
                    isChecked
                      ? "bg-teal-50/40 border-teal-200 shadow-2xs"
                      : "bg-white border-transparent hover:bg-slate-50/80"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Checkbox and Details */}
                    <div className="flex items-start gap-3 flex-1">
                      <button
                        type="button"
                        onClick={() => handleToggleItem(item.code)}
                        className="mt-1 text-teal-700 shrink-0 cursor-pointer"
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-teal-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-300 hover:text-slate-400" />
                        )}
                      </button>

                      <div className="space-y-1 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="font-mono text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.code}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.type === "CLINICAL_SERVICE"
                                ? "bg-teal-100 text-teal-800"
                                : "bg-indigo-100 text-indigo-800"
                            }`}
                          >
                            {item.type === "CLINICAL_SERVICE" ? "Clinical Service" : "Diagnostic Test"}
                          </span>
                          <span className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            {item.category}
                          </span>
                          {alreadyExists && (
                            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Already in your catalog (Will Update)
                            </span>
                          )}
                          {item.homeSampleAvailable && (
                            <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                              Home Sample
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 pt-0.5">
                          <div className="shrink-0">{getItemIcon(item)}</div>
                          <h3 className="text-sm font-bold text-slate-900">{item.name}</h3>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                          {item.description}
                        </p>

                        {(item.deliveryTime || item.preparation) && (
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 pt-1">
                            {item.deliveryTime && (
                              <span>Turnaround: <strong>{item.deliveryTime}</strong></span>
                            )}
                            {item.preparation && (
                              <span className="truncate max-w-md" title={item.preparation}>
                                Prep: {item.preparation}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Custom Price Inputs for this facility */}
                    <div className="flex sm:items-center gap-3 shrink-0 lg:w-72 bg-slate-50/80 p-3 rounded-2xl border border-slate-200">
                      <div className="flex-1 space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-600">
                          Facility Fee (৳) *
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            ৳
                          </span>
                          <input
                            type="number"
                            min={0}
                            value={pricing.customPrice}
                            onChange={(e) => {
                              handlePriceChange(item.code, Number(e.target.value) || 0);
                              if (!isChecked) handleToggleItem(item.code);
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-6 pr-2 text-xs font-bold text-slate-900 focus:border-teal-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Discount (৳)
                        </label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                            ৳
                          </span>
                          <input
                            type="number"
                            min={0}
                            placeholder="Optional"
                            value={pricing.customDiscount ?? ""}
                            onChange={(e) => {
                              const val = e.target.value === "" ? "" : Number(e.target.value);
                              handleDiscountChange(item.code, val);
                              if (!isChecked) handleToggleItem(item.code);
                            }}
                            className="w-full rounded-xl border border-slate-300 bg-white py-1.5 pl-6 pr-2 text-xs font-bold text-emerald-700 focus:border-teal-600 focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-slate-100 bg-slate-50/80 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-600 text-center sm:text-left">
            {selectedCount > 0 ? (
              <span>
                Ready to import <strong>{selectedCount}</strong> selected items with custom pricing.
              </span>
            ) : (
              <span>Select the items you want to offer at this medical facility.</span>
            )}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedCount === 0 || isSubmitting}
              onClick={handleSaveToFacility}
              className="flex items-center justify-center gap-2 rounded-2xl bg-teal-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-teal-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Add {selectedCount > 0 ? `(${selectedCount}) Items to Facility` : "Selected"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
