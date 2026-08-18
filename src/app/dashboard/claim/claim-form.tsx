"use client";

import { useActionState, useState } from "react";
import { createClaimAction } from "@/lib/actions/claim";
import { initialFormState, fieldError } from "@/lib/form";

type Doctor = { id: number; fullName: string; specialty: { name: string } | null };

export default function ClaimForm({
  doctors,
  initialDoctorId,
}: {
  doctors: Doctor[];
  initialDoctorId: number | null;
}) {
  const [state, formAction, pending] = useActionState(createClaimAction, initialFormState);
  const [selected, setSelected] = useState<number | null>(initialDoctorId);
  const [query, setQuery] = useState("");

  const filtered = query
    ? doctors.filter((d) => d.fullName.toLowerCase().includes(query.toLowerCase()))
    : doctors;

  return (
    <form action={formAction} className="space-y-5 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
      {state.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          {state.message}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Find your profile
        </label>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type doctor name..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        <select
          name="doctorId"
          required
          value={selected ?? ""}
          onChange={(e) => setSelected(Number(e.target.value))}
          className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        >
          <option value="">Select a doctor</option>
          {filtered.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName}
              {d.specialty ? ` — ${d.specialty.name}` : ""}
            </option>
          ))}
        </select>
        {fieldError(state, "doctorId") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "doctorId")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          BMDC registration number
        </label>
        <input
          name="bmdcNumber"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          License image URL (optional)
        </label>
        <input
          name="licenseImage"
          placeholder="https://..."
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Note for admin</label>
        <textarea
          name="note"
          rows={3}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending || !selected}
        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit claim"}
      </button>
    </form>
  );
}
