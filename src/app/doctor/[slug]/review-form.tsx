"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createReviewAction } from "@/lib/actions/doctor";
import { initialFormState, fieldError } from "@/lib/form";

export default function ReviewForm({
  doctorId,
  loggedIn,
}: {
  doctorId: number;
  loggedIn: boolean;
}) {
  const [state, formAction, pending] = useActionState(createReviewAction, initialFormState);

  if (!loggedIn) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-700">
        <Link
          href={`/login?callbackUrl=/doctor`}
          className="font-semibold text-slate-900 hover:underline"
        >
          Log in
        </Link>{" "}
        to leave a review.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Write a review</h3>
      <input type="hidden" name="doctorId" value={doctorId} />
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Rating</label>
        <select
          name="rating"
          required
          defaultValue="5"
          className="rounded-2xl border border-slate-300 px-4 py-2 text-sm"
        >
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {"★".repeat(n)}
            </option>
          ))}
        </select>
        {fieldError(state, "rating") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "rating")}</p>
        )}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Comment (optional)</label>
        <textarea
          name="comment"
          rows={4}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending}
        className="rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Submitting..." : "Submit review"}
      </button>
      <p className="text-xs text-slate-500">
        Reviews are visible after admin approval.
      </p>
    </form>
  );
}
