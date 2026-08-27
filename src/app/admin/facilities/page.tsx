import { prisma } from "@/lib/prisma";
import FacilitiesManager from "./facilities-manager";

export const metadata = { title: "Facilities | Admin" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminFacilitiesPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [facilities, upazilas] = await Promise.all([
    prisma.facility.findMany({
      orderBy: { name: "asc" },
      include: {
        upazila: { include: { district: { include: { division: true } } } },
        _count: { select: { doctorFacilities: true, tests: true } },
      },
    }),
    prisma.upazila.findMany({
      orderBy: { name: "asc" },
      include: { district: { select: { name: true } } },
    }),
  ]);

  const formattedFacilities = facilities.map((f) => ({
    id: f.id,
    name: f.name,
    slug: f.slug,
    type: f.type,
    logo: f.logo,
    address: f.address,
    phone: f.phone,
    upazilaId: f.upazilaId,
    upazilaName: f.upazila?.name || "Unknown Upazila",
    districtName: f.upazila?.district?.name || "Unknown District",
    divisionName: f.upazila?.district?.division?.name || "Unknown Division",
    doctorCount: f._count.doctorFacilities,
    testCount: f._count.tests,
  }));

  const formattedUpazilas = upazilas.map((u) => ({
    id: u.id,
    name: u.name,
    districtName: u.district?.name || "Unknown District",
  }));

  return (
    <div className="space-y-6">
      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Facility saved successfully.
        </div>
      )}

      <FacilitiesManager
        initialFacilities={formattedFacilities}
        upazilas={formattedUpazilas}
      />
    </div>
  );
}

