"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import {
  Upload,
  Trash2,
  Loader2,
  Building2,
  Check,
  Link as LinkIcon,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { FacilityLogo } from "./facility-logo";

interface FacilityLogoUploaderProps {
  currentLogoUrl?: string | null;
  facilityId?: number;
  facilityName?: string;
  facilityType?: string;
  onLogoChange?: (url: string | null) => void;
  saveAction?: (facilityId: number, logoUrl: string | null) => Promise<{ ok: boolean; message: string }>;
  label?: string;
  subLabel?: string;
  inputName?: string;
}

export function FacilityLogoUploader({
  currentLogoUrl,
  facilityId,
  facilityName = "Medical Institute",
  facilityType = "HOSPITAL",
  onLogoChange,
  saveAction,
  label = "Institute / Hospital Logo",
  subLabel = "Upload an official brand logo or badge (PNG, JPG, SVG, WEBP). Recommended size: 256x256 or square ratio.",
  inputName = "logo",
}: FacilityLogoUploaderProps) {
  const [logoUrl, setLogoUrl] = useState<string | null>(currentLogoUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (PNG, JPG, WEBP, or SVG).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Logo file size must be under 10MB.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append(
        "filename",
        `facility-logo-${facilityId || "new"}-${Date.now()}`
      );

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to upload logo image.");
      }

      const uploadedUrl = data.url;
      setLogoUrl(uploadedUrl);
      onLogoChange?.(uploadedUrl);

      // If facilityId and saveAction provided, persist directly
      if (facilityId && saveAction) {
        const result = await saveAction(facilityId, uploadedUrl);
        if (!result.ok) {
          throw new Error(result.message || "Failed to save logo to facility profile.");
        }
      }

      setSuccessMessage("Institute logo uploaded and updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while uploading the logo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemoveLogo() {
    setError(null);
    setSuccessMessage(null);
    setIsRemoving(true);

    try {
      if (facilityId && saveAction) {
        const result = await saveAction(facilityId, null);
        if (!result.ok) {
          throw new Error(result.message || "Failed to remove logo.");
        }
      }

      setLogoUrl(null);
      setCustomUrl("");
      onLogoChange?.(null);
      setSuccessMessage("Institute logo removed.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to remove logo.");
    } finally {
      setIsRemoving(false);
    }
  }

  function handleApplyCustomUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!customUrl.trim()) return;

    const trimmed = customUrl.trim();
    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
      setError("Please provide a valid web URL starting with http:// or https://");
      return;
    }

    setError(null);
    setLogoUrl(trimmed);
    onLogoChange?.(trimmed);

    if (facilityId && saveAction) {
      saveAction(facilityId, trimmed).catch((err) => {
        setError(err.message || "Failed to save URL.");
      });
    }

    setShowUrlInput(false);
    setSuccessMessage("Logo URL applied!");
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-4">
      {/* Hidden input to pass value in traditional form submissions */}
      <input type="hidden" name={inputName} value={logoUrl || ""} />
      <input
        type="hidden"
        name="removeLogo"
        value={!logoUrl && currentLogoUrl ? "true" : "false"}
      />

      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Building2 className="h-4 w-4 text-teal-700" />
            <span>{label}</span>
          </label>
          {subLabel && <p className="text-xs text-slate-500 mt-0.5">{subLabel}</p>}
        </div>

        {logoUrl && (
          <button
            type="button"
            onClick={handleRemoveLogo}
            disabled={isRemoving || isUploading}
            className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition disabled:opacity-50 cursor-pointer"
            title="Delete Institute Logo"
          >
            {isRemoving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
            <span>Remove Logo</span>
          </button>
        )}
      </div>

      {/* Main Logo & Upload Area */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 rounded-3xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5">
        {/* Visual Preview */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <FacilityLogo
            src={logoUrl}
            name={facilityName}
            type={facilityType}
            size="xl"
            shape="rounded"
            className="shadow-xs"
          />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {logoUrl ? "Active Logo" : "No Logo (Default)"}
          </span>
        </div>

        {/* Action Controls & Drag Drop Area */}
        <div className="flex-1 w-full space-y-3">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl border-2 border-dashed p-4 transition text-center sm:text-left ${
              isDragging
                ? "border-teal-500 bg-teal-50/50"
                : "border-slate-300 bg-white hover:border-teal-400"
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-800">
                {isDragging ? "Drop image to upload" : "Upload Brand Logo"}
              </p>
              <p className="text-[11px] text-slate-500">
                Drag and drop image here or browse from device
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
                id="facility-logo-input"
              />

              <label
                htmlFor="facility-logo-input"
                className={`inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs cursor-pointer ${
                  isUploading ? "opacity-60 pointer-events-none" : ""
                }`}
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-3.5 w-3.5" />
                    <span>Browse Image</span>
                  </>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="inline-flex items-center gap-1 rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition cursor-pointer"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                <span>Web URL</span>
              </button>
            </div>
          </div>

          {/* Web URL input toggle */}
          {showUrlInput && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com/hospital-logo.png"
                className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-teal-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCustomUrl}
                className="rounded-xl bg-slate-800 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-900 transition"
              >
                Apply URL
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-xs text-slate-500 hover:text-slate-700 px-1"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
          <Check className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}
    </div>
  );
}
