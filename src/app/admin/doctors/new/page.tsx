import { prisma } from "@/lib/prisma";
import DoctorCreateForm from "./doctor-form";

export const metadata = { title: "New doctor | Admin" };

export default async function NewDoctorPage() {
  const [specialties, facilities] = await Promise.all([
    prisma.specialty.findMany({ orderBy: { name: "asc" } }),
    prisma.facility.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">Add doctor</h1>
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <DoctorCreateForm
          specialties={specialties.map((s) => ({ id: s.id, name: s.name }))}
          facilities={facilities.map((f) => ({ id: f.id, name: f.name, type: f.type }))}
        />
      </div>
    </div>
  );
}
