import { prisma } from "@/lib/prisma";
import { deleteFacilityAction } from "@/lib/actions/admin";
import FacilityCreateForm from "./facility-form";

export const metadata = { title: "Facilities | Admin" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminFacilitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [facilities, upazilas] = await Promise.all([
    prisma.facility.findMany({
      orderBy: { name: "asc" },
      include: {
        upazila: { include: { district: { include: { division: true } } } },
        _count: { select: { doctorFacilities: true } },
      },
    }),
    prisma.upazila.findMany({
      orderBy: { name: "asc" },
      include: { district: { select: { name: true } } },
    }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">Facilities</h1>
      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">Add facility</h2>
        <FacilityCreateForm
          upazilas={upazilas.map((u) => ({ id: u.id, name: `${u.name} (${u.district.name})` }))}
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Doctors</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {facilities.map((f) => (
              <tr key={f.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{f.name}</td>
                <td className="px-4 py-3 text-slate-600">{f.type}</td>
                <td className="px-4 py-3 text-slate-600">
                  {f.upazila.name}, {f.upazila.district.name}, {f.upazila.district.division.name}
                </td>
                <td className="px-4 py-3 text-slate-600">{f._count.doctorFacilities}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteFacilityAction} className="inline">
                    <input type="hidden" name="id" value={f.id} />
                    <button
                      type="submit"
                      className="rounded-2xl border border-rose-200 px-3 py-1 text-xs font-medium text-rose-700 hover:bg-rose-50"
                    >
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {facilities.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-slate-500">
                  No facilities yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
