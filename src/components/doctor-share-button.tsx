"use client";

import { useState } from "react";
import { Share2, Check, Copy } from "lucide-react";

export function DoctorShareButton({
  doctorName,
  specialty,
}: {
  doctorName: string;
  specialty?: string | null;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const title = `${doctorName}${specialty ? ` - ${specialty}` : ""}`;
    const text = `Find qualifications, visiting hours, chamber address, and consultation fees for ${doctorName}.`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (err) {
        // Fallback to clipboard if share was canceled or failed
      }
    }

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <button
      onClick={handleShare}
      type="button"
      className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition cursor-pointer"
      title="Share Doctor Profile"
    >
      {copied ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600" />
          <span className="text-emerald-700">Link Copied!</span>
        </>
      ) : (
        <>
          <Share2 className="h-3.5 w-3.5 text-slate-500" />
          <span>Share Profile</span>
        </>
      )}
    </button>
  );
}
