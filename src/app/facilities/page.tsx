import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FacilitiesDirectoryView, type FacilityListItem, type DivisionOption } from "./facilities-directory-view";
import { DEFAULT_DIAGNOSTIC_TESTS } from "@/lib/diagnostic-tests-data";

export const metadata: Metadata = {
  title: "Hospitals & Diagnostic Centers Directory | Doctor Directory Bangladesh",
  description:
    "Search top hospitals, specialized diagnostic labs, imaging centers, and clinics in Bangladesh. Compare diagnostic test pricing, find practicing doctors, and 24/7 hotline numbers.",
};

export default async function FacilitiesPage() {
  const [facilities, divisions, totalDoctors, totalDbTests] = await Promise.all([
    prisma.facility.findMany({
      orderBy: { name: "asc" },
      include: {
        upazila: {
          include: {
            district: {
              include: {
                division: true,
              },
            },
          },
        },
        tests: {
          where: { isActive: true },
          select: {
            name: true,
            code: true,
            price: true,
            discountPrice: true,
            category: true,
          },
        },
        _count: {
          select: {
            doctorFacilities: true,
            tests: true,
          },
        },
      },
    }),
    prisma.division.findMany({
      orderBy: { name: "asc" },
      include: {
        districts: {
          orderBy: { name: "asc" },
          include: {
            upazilas: {
              orderBy: { name: "asc" },
            },
          },
        },
      },
    }),
    prisma.doctor.count({ where: { status: "PUBLISHED" } }),
    prisma.facilityTest.count({ where: { isActive: true } }),
  ]);

  const formattedFacilities: FacilityListItem[] = facilities.map((f) => {
    // If facility has custom tests in DB, use them; otherwise provide the standard preview
    const activeTests =
      f.tests.length > 0
        ? f.tests
        : DEFAULT_DIAGNOSTIC_TESTS.slice(0, 8).map((t) => ({
            name: t.name,
            code: t.code,
            price: t.price,
            discountPrice: t.discountPrice || null,
            category: t.category,
          }));

    const prices = activeTests.map((t) => t.discountPrice || t.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    return {
      id: f.id,
      name: f.name,
      slug: f.slug,
      type: f.type,
      address: f.address,
      phone: f.phone,
      upazila: {
        id: f.upazila.id,
        name: f.upazila.name,
        slug: f.upazila.slug,
        district: {
          id: f.upazila.district.id,
          name: f.upazila.district.name,
          slug: f.upazila.district.slug,
          division: {
            id: f.upazila.district.division.id,
            name: f.upazila.district.division.name,
            slug: f.upazila.district.division.slug,
          },
        },
      },
      doctorCount: f._count.doctorFacilities,
      testCount: f._count.tests > 0 ? f._count.tests : DEFAULT_DIAGNOSTIC_TESTS.length,
      minPrice,
      maxPrice,
      testsPreview: activeTests,
    };
  });

  const formattedDivisions: DivisionOption[] = divisions.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    districts: d.districts.map((dist) => ({
      id: dist.id,
      name: dist.name,
      slug: dist.slug,
      upazilas: dist.upazilas.map((u) => ({
        id: u.id,
        name: u.name,
        slug: u.slug,
      })),
    })),
  }));

  const estimatedTotalTests =
    totalDbTests > 0 ? totalDbTests : facilities.length * DEFAULT_DIAGNOSTIC_TESTS.length;

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8">
      <FacilitiesDirectoryView
        facilities={formattedFacilities}
        divisions={formattedDivisions}
        totalDoctors={totalDoctors}
        totalTests={estimatedTotalTests}
      />
    </main>
  );
}
