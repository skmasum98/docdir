import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth-helpers";
import { FacilityTestsEditor } from "./facility-tests-editor";

interface FacilityTestsPageProps {
  params: Promise<{ id: string }>;
}

export default async function FacilityTestsPage({ params }: FacilityTestsPageProps) {
  await requireAdmin();
  const { id } = await params;
  const facilityId = Number(id);

  if (!Number.isFinite(facilityId)) {
    notFound();
  }

  const facility = await prisma.facility.findUnique({
    where: { id: facilityId },
    include: {
      upazila: {
        include: {
          district: true,
        },
      },
      tests: {
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
    },
  });

  if (!facility) {
    notFound();
  }

  const facilityData = {
    id: facility.id,
    name: facility.name,
    slug: facility.slug,
    type: facility.type,
    address: facility.address,
    phone: facility.phone,
    upazilaName: facility.upazila?.name || "Unknown Upazila",
    districtName: facility.upazila?.district?.name || "Unknown District",
  };

  return (
    <FacilityTestsEditor
      facility={facilityData}
      initialTests={facility.tests}
    />
  );
}
