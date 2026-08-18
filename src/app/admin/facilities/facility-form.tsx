"use client";

import { useActionState } from "react";
import { createFacilityAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { FacilityType } from "@/lib/enums";

type Upazila = { id: number; name: string };

export default function FacilityCreateForm({ upazilas }: { upazilas: Upazila[] }) {
  const [state, formAction, pending] = useActionState(createFacilityAction, initialFormState);
  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <div>
        <label className={labelCls}>Name *</label>
        <input name="name" required className={inputCls} />
        {fieldError(state, "name") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "name")}</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Type</label>
        <select name="type" defaultValue={FacilityType.HOSPITAL} className={inputCls}>
          {Object.values(FacilityType).map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className={labelCls}>Upazila *</label>
        <select name="upazilaId" required className={inputCls} defaultValue="">
          <option value="">Select upazila</option>
          {upazilas.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </select>
        {fieldError(state, "upazilaId") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "upazilaId")}</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input name="phone" className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <label className={labelCls}>Address</label>
        <textarea name="address" rows={2} className={inputCls} />
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Add facility"}
        </button>
      </div>
    </form>
  );
}
