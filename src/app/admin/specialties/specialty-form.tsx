"use client";

import { useActionState } from "react";
import { createSpecialtyAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";

export default function SpecialtyCreateForm() {
  const [state, formAction, pending] = useActionState(createSpecialtyAction, initialFormState);
  return (
    <form action={formAction} className="flex items-end gap-2">
      <div className="flex-1">
        <label className="mb-1 block text-sm font-medium text-slate-700">New specialty</label>
        <input
          name="name"
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "name") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "name")}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "..." : "Add"}
      </button>
      {state.message && !state.ok && (
        <p className="ml-2 text-xs text-rose-700">{state.message}</p>
      )}
    </form>
  );
}
