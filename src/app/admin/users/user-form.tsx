"use client";

import { useActionState } from "react";
import { updateUserAction } from "@/lib/actions/admin";
import { initialFormState, fieldError } from "@/lib/form";
import { UserRole } from "@/lib/enums";

type User = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "DOCTOR" | "PATIENT";
  isActive: boolean;
  createdAt: Date;
};

export default function UserEditForm({ user }: { user: User }) {
  const [state, formAction, pending] = useActionState(updateUserAction, initialFormState);
  const inputCls =
    "w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none";
  const labelCls = "mb-1 block text-sm font-medium text-slate-700";

  return (
    <form action={formAction} className="grid gap-4 md:grid-cols-2">
      <input type="hidden" name="id" value={user.id} />
      {state.message && !state.ok && (
        <div className="md:col-span-2 rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {state.message}
        </div>
      )}
      <div>
        <label className={labelCls}>Name</label>
        <input name="name" defaultValue={user.name} required className={inputCls} />
        {fieldError(state, "name") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "name")}</p>
        )}
      </div>
      <div>
        <label className={labelCls}>Email</label>
        <input value={user.email} disabled className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Phone</label>
        <input name="phone" defaultValue={user.phone ?? ""} className={inputCls} />
      </div>
      <div>
        <label className={labelCls}>Role</label>
        <select name="role" defaultValue={user.role} className={inputCls}>
          {Object.values(UserRole).map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 md:col-span-2">
        <input
          id={`active-${user.id}`}
          name="isActive"
          type="checkbox"
          defaultChecked={user.isActive}
          className="h-4 w-4"
        />
        <label htmlFor={`active-${user.id}`} className="text-sm text-slate-700">
          Active
        </label>
      </div>
      <div className="md:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}
