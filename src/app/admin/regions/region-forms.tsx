"use client";

import { useActionState } from "react";
import {
  createDivisionAction,
  createDistrictAction,
  createUpazilaAction,
} from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";

type Division = { id: number; name: string };
type District = { id: number; name: string; divisionId: number };

export default function RegionForms({
  divisions,
  districts,
}: {
  divisions: Division[];
  districts: District[];
}) {
  const [dState, dAction, dPending] = useActionState(createDivisionAction, initialFormState);
  const [dsState, dsAction, dsPending] = useActionState(createDistrictAction, initialFormState);
  const [uState, uAction, uPending] = useActionState(createUpazilaAction, initialFormState);

  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <form action={dAction} className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Add division</h3>
        <div>
          <label className={labelCls}>Name</label>
          <input name="name" required className={inputCls} />
          {fieldError(dState, "name") && (
            <p className="mt-1 text-xs text-rose-700">{fieldError(dState, "name")}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={dPending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {dPending ? "..." : "Add"}
        </button>
      </form>

      <form action={dsAction} className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Add district</h3>
        <div>
          <label className={labelCls}>Name</label>
          <input name="name" required className={inputCls} />
          {fieldError(dsState, "name") && (
            <p className="mt-1 text-xs text-rose-700">{fieldError(dsState, "name")}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>Division</label>
          <select name="divisionId" required className={inputCls} defaultValue="">
            <option value="">Select division</option>
            {divisions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {fieldError(dsState, "divisionId") && (
            <p className="mt-1 text-xs text-rose-700">{fieldError(dsState, "divisionId")}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={dsPending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {dsPending ? "..." : "Add"}
        </button>
      </form>

      <form action={uAction} className="space-y-2 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="font-semibold text-slate-900">Add upazila</h3>
        <div>
          <label className={labelCls}>Name</label>
          <input name="name" required className={inputCls} />
          {fieldError(uState, "name") && (
            <p className="mt-1 text-xs text-rose-700">{fieldError(uState, "name")}</p>
          )}
        </div>
        <div>
          <label className={labelCls}>District</label>
          <select name="districtId" required className={inputCls} defaultValue="">
            <option value="">Select district</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
          {fieldError(uState, "districtId") && (
            <p className="mt-1 text-xs text-rose-700">{fieldError(uState, "districtId")}</p>
          )}
        </div>
        <button
          type="submit"
          disabled={uPending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {uPending ? "..." : "Add"}
        </button>
      </form>
    </div>
  );
}
