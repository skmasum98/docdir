import { prisma } from "@/lib/prisma";
import { claimDecisionAction } from "@/lib/actions/admin";
import { ClaimStatus } from "@/lib/enums";

export const metadata = { title: "Claims | Admin" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminClaimsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filter = sp.filter ?? ClaimStatus.PENDING;
  const where =
    filter === "all"
      ? {}
      : { status: filter === "pending" ? ClaimStatus.PENDING : (filter as ClaimStatus) };
  const claims = await prisma.doctorClaim.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      doctor: { select: { id: true, fullName: true, slug: true } },
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold text-slate-900">Profile claims</h1>
        <div className="flex flex-wrap gap-2 text-sm">
          {["pending", "approved", "rejected", "all"].map((f) => (
            <a
              key={f}
              href={`/admin/claims?filter=${f}`}
              className={`rounded-2xl border px-4 py-2 capitalize ${
                filter === f
                  ? "border-slate-950 bg-slate-950 text-white"
                  : "border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              {f}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {claims.map((c) => (
          <div key={c.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{c.user?.name || "User"}</p>
                <p className="text-xs text-slate-500">
                  {c.user?.email || "No email"} {c.user?.phone && `· ${c.user.phone}`}
                </p>
                <p className="mt-2 text-sm">
                  Claiming{" "}
                  {c.doctor ? (
                    <a
                      href={`/doctor/${c.doctor.slug}`}
                      className="font-semibold text-indigo-700 hover:underline"
                    >
                      {c.doctor.fullName}
                    </a>
                  ) : (
                    "Doctor profile"
                  )}
                </p>
                {c.bmdcNumber && (
                  <p className="mt-1 text-xs text-slate-600">BMDC: {c.bmdcNumber}</p>
                )}
                {c.licenseImage && (
                  <p className="mt-1 text-xs">
                    License:{" "}
                    <a
                      href={c.licenseImage}
                      className="text-indigo-700 hover:underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      View
                    </a>
                  </p>
                )}
                {c.note && (
                  <p className="mt-2 text-sm text-slate-700">{c.note}</p>
                )}
                <p className="mt-2 text-xs">
                  Status: <span className="font-semibold">{c.status}</span>
                </p>
              </div>
              {c.status === ClaimStatus.PENDING && (
                <div className="flex flex-col gap-2">
                  <form action={claimDecisionAction}>
                    <input type="hidden" name="claimId" value={c.id} />
                    <input type="hidden" name="status" value={ClaimStatus.APPROVED} />
                    <button
                      type="submit"
                      className="rounded-2xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      Approve
                    </button>
                  </form>
                  <form action={claimDecisionAction}>
                    <input type="hidden" name="claimId" value={c.id} />
                    <input type="hidden" name="status" value={ClaimStatus.REJECTED} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-rose-300 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Reject
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        ))}
        {claims.length === 0 && <p className="text-sm text-slate-500">No claims to show.</p>}
      </div>
    </div>
  );
}
