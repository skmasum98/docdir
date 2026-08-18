"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { initialFormState, fieldError } from "@/lib/form";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialFormState);

  return (
    <form action={formAction} className="space-y-5">
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
        <input
          name="name"
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "name") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "name")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "email") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "email")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
        <input
          name="phone"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "phone") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "phone")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "password") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "password")}</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">I am registering as</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-slate-300 p-3 text-sm has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50">
            <input type="radio" name="role" value="PATIENT" defaultChecked />
            <span>
              <span className="block font-semibold">Patient</span>
              <span className="block text-xs text-slate-500">Find and review doctors</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-slate-300 p-3 text-sm has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50">
            <input type="radio" name="role" value="DOCTOR" />
            <span>
              <span className="block font-semibold">Doctor</span>
              <span className="block text-xs text-slate-500">
                Create and update your profile
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
