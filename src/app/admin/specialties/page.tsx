import { prisma } from "@/lib/prisma";
import { deleteSpecialtyAction } from "@/lib/actions/admin";
import SpecialtyCreateForm from "./specialty-form";

export const metadata = { title: "Specialties | Admin" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminSpecialtiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const specialties = await prisma.specialty.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { doctors: true } } },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">Specialties</h1>
      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </div>
      )}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <SpecialtyCreateForm />
      </div>
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3">Doctors</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {specialties.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{s.name}</td>
                <td className="px-4 py-3 text-slate-500">{s.slug}</td>
                <td className="px-4 py-3 text-slate-600">{s._count.doctors}</td>
                <td className="px-4 py-3 text-right">
                  <form action={deleteSpecialtyAction} className="inline">
                    <input type="hidden" name="id" value={s.id} />
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
            {specialties.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-slate-500">
                  No specialties yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
