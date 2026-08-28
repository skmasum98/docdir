import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { FacilitiesDirectoryView, type FacilityListItem, type DivisionOption } from "./facilities-directory-view";

export const metadata: Metadata = {
  title: "Hospitals & Diagnostic Centers Directory | Doctor Directory Bangladesh",
  description:
    "Search top hospitals, specialized diagnostic labs, imaging centers, and clinics in Bangladesh. Compare diagnostic test pricing, find practicing doctors, and 24/7 hotline numbers.",
  openGraph: {
    title: "Hospitals & Diagnostic Centers Directory | Doctor Directory Bangladesh",
    description:
      "Search top hospitals, specialized diagnostic labs, imaging centers, and clinics in Bangladesh. Compare diagnostic test pricing, find practicing doctors, and 24/7 hotline numbers.",
    type: "website",
    locale: "en_BD",
    siteName: "Doctor Directory",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hospitals & Diagnostic Centers Directory | Doctor Directory Bangladesh",
    description:
      "Search top hospitals, specialized diagnostic labs, imaging centers, and clinics in Bangladesh.",
  },
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
    // Only use custom tests configured in the database
    const activeTests = f.tests;

    const prices = activeTests.map((t) => t.discountPrice || t.price);
    const minPrice = prices.length > 0 ? Math.min(...prices) : null;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : null;

    return {
      id: f.id,
      name: f.name,
      slug: f.slug,
      type: f.type,
      logo: f.logo,
      address: f.address,
      phone: f.phone,
      upazila: {
        id: f.upazila?.id || 0,
        name: f.upazila?.name || "General",
        slug: f.upazila?.slug || "general",
        district: {
          id: f.upazila?.district?.id || 0,
          name: f.upazila?.district?.name || "General District",
          slug: f.upazila?.district?.slug || "general",
          division: {
            id: f.upazila?.district?.division?.id || 0,
            name: f.upazila?.district?.division?.name || "General Division",
            slug: f.upazila?.district?.division?.slug || "general",
          },
        },
      },
      doctorCount: f._count.doctorFacilities,
      testCount: f._count.tests,
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

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8">
      <FacilitiesDirectoryView
        facilities={formattedFacilities}
        divisions={formattedDivisions}
        totalDoctors={totalDoctors}
        totalTests={totalDbTests}
      />
    </main>
  );
}
