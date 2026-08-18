"use client";

import { useActionState } from "react";
import { createBlogAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { BlogStatus } from "@/lib/enums";

type Doctor = { id: number; fullName: string };

export default function BlogCreateForm({ doctors }: { doctors: Doctor[] }) {
  const [state, formAction, pending] = useActionState(createBlogAction, initialFormState);
  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="grid gap-4">
      {state.message && !state.ok && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.message}
        </div>
      )}
      <div>
        <label className={labelCls}>Title *</label>
        <input name="title" required className={inputCls} />
        {fieldError(state, "title") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "title")}</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Excerpt</label>
        <textarea name="excerpt" rows={2} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Content *</label>
        <textarea name="content" required rows={8} className={inputCls} />
        {fieldError(state, "content") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "content")}</p>
        )}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelCls}>Doctor (optional)</label>
          <select name="doctorId" className={inputCls} defaultValue="">
            <option value="">None</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelCls}>Status</label>
          <select name="status" defaultValue={BlogStatus.DRAFT} className={inputCls}>
            {Object.values(BlogStatus).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Create post"}
        </button>
      </div>
    </form>
  );
}
