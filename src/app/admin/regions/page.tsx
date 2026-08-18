import { prisma } from "@/lib/prisma";
import {
  deleteDivisionAction,
  deleteDistrictAction,
  deleteUpazilaAction,
} from "@/lib/actions/admin";
import RegionForms from "./region-forms";

export const metadata = { title: "Regions | Admin" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminRegionsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const divisions = await prisma.division.findMany({
    orderBy: { name: "asc" },
    include: {
      districts: {
        orderBy: { name: "asc" },
        include: { upazilas: { orderBy: { name: "asc" } } },
      },
    },
  });
  const districts = await prisma.district.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">Regions</h1>
      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </div>
      )}

      <RegionForms
        divisions={divisions.map((d) => ({ id: d.id, name: d.name }))}
        districts={districts.map((d) => ({ id: d.id, name: d.name, divisionId: d.divisionId }))}
      />

      <div className="space-y-4">
        {divisions.map((d) => (
          <div key={d.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">{d.name}</h2>
              <form action={deleteDivisionAction}>
                <input type="hidden" name="id" value={d.id} />
                <button
                  type="submit"
                  className="rounded-2xl border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  Delete division
                </button>
              </form>
            </div>
            <div className="mt-4 space-y-4">
              {d.districts?.map((ds: any) => (
                <div key={ds.id} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-800">{ds.name}</h3>
                    <form action={deleteDistrictAction}>
                      <input type="hidden" name="id" value={ds.id} />
                      <button
                        type="submit"
                        className="rounded-2xl border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                  {ds.upazilas?.length > 0 && (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {ds.upazilas.map((u: any) => (
                        <li
                          key={u.id}
                          className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs"
                        >
                          {u.name}
                          <form action={deleteUpazilaAction}>
                            <input type="hidden" name="id" value={u.id} />
                            <button
                              type="submit"
                              className="text-rose-700 hover:underline"
                            >
                              ×
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
              {(!d.districts || d.districts.length === 0) && (
                <p className="text-sm text-slate-500">No districts yet.</p>
              )}
            </div>
          </div>
        ))}
        {divisions.length === 0 && (
          <p className="text-sm text-slate-500">No regions yet.</p>
        )}
      </div>
    </div>
  );
}
