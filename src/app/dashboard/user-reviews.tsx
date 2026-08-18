"use client";

import Link from "next/link";
import { deleteOwnReviewAction } from "@/lib/actions/doctor";

type Review = {
  id: number;
  rating: number;
  comment: string;
  isApproved: boolean;
  doctorSlug: string;
  doctorName: string;
};

export default function UserReviews({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm text-slate-700">
          You haven&apos;t reviewed any doctors yet.{" "}
          <Link href="/search" className="font-semibold text-slate-900 hover:underline">
            Find a doctor
          </Link>{" "}
          and share your experience.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div
          key={r.id}
          className="flex items-start justify-between gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div>
            <Link
              href={`/doctor/${r.doctorSlug}`}
              className="text-base font-semibold text-slate-900 hover:underline"
            >
              {r.doctorName}
            </Link>
            <p className="mt-1 text-sm text-amber-600">{"★".repeat(r.rating)}</p>
            {r.comment && <p className="mt-2 text-sm text-slate-700">{r.comment}</p>}
            <p className="mt-2 text-xs text-slate-500">
              {r.isApproved ? "Published" : "Awaiting admin approval"}
            </p>
          </div>
          <form action={deleteOwnReviewAction}>
            <input type="hidden" name="reviewId" value={r.id} />
            <button
              type="submit"
              className="rounded-2xl border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Delete
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
