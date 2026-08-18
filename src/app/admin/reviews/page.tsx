import { prisma } from "@/lib/prisma";
import { reviewDecisionAction, deleteReviewAction } from "@/lib/actions/admin";

export const metadata = { title: "Reviews | Admin" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = sp.filter ?? "pending";
  const where = filter === "all" ? {} : { isApproved: false };
  const reviews = await prisma.review.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { fullName: true, slug: true } },
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-900">Reviews</h1>
        <div className="flex gap-2 text-sm">
          <a
            href="/admin/reviews?filter=pending"
            className={`rounded-2xl border px-4 py-2 ${
              filter === "pending"
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Pending
          </a>
          <a
            href="/admin/reviews?filter=all"
            className={`rounded-2xl border px-4 py-2 ${
              filter === "all"
                ? "border-slate-950 bg-slate-950 text-white"
                : "border-slate-300 text-slate-700 hover:bg-slate-50"
            }`}
          >
            All
          </a>
        </div>
      </div>

      <div className="space-y-3">
        {reviews.map((r) => (
          <div
            key={r.id}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">{r.user?.name || "Anonymous"}</p>
                <p className="text-xs text-slate-500">{r.user?.email || ""}</p>
                <p className="mt-2 text-sm">
                  About{" "}
                  {r.doctor ? (
                    <a
                      href={`/doctor/${r.doctor.slug}`}
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      {r.doctor.fullName}
                    </a>
                  ) : (
                    "Doctor"
                  )}
                </p>
                <p className="mt-2 text-amber-600">{"★".repeat(r.rating)}</p>
                {r.comment && (
                  <p className="mt-2 text-sm text-slate-700">{r.comment}</p>
                )}
                <p className="mt-2 text-xs text-slate-500">
                  {r.createdAt.toLocaleDateString()} &middot;{" "}
                  {r.isApproved ? (
                    <span className="text-emerald-700">Approved</span>
                  ) : (
                    <span className="text-amber-700">Pending</span>
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                {!r.isApproved && (
                  <form action={reviewDecisionAction}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="isApproved" value="true" />
                    <button
                      type="submit"
                      className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </form>
                )}
                {r.isApproved && (
                  <form action={reviewDecisionAction}>
                    <input type="hidden" name="reviewId" value={r.id} />
                    <input type="hidden" name="isApproved" value="false" />
                    <button
                      type="submit"
                      className="rounded-2xl border border-amber-300 px-3 py-2 text-xs font-medium text-amber-800 hover:bg-amber-50"
                    >
                      Unapprove
                    </button>
                  </form>
                )}
                <form action={deleteReviewAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <button
                    type="submit"
                    className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </form>
              </div>
            </div>
          </div>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-slate-500">No reviews to show.</p>
        )}
      </div>
    </div>
  );
}
