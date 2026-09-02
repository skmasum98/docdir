import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = "https://drchamber.info";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Public static pages only
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/facilities`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
  ];

  try {
    const [
      doctors,
      facilities,
      divisions,
      specialties,
    ] = await Promise.all([
      prisma.doctor.findMany({
        where: {
          status: "PUBLISHED",
        },
        select: {
          slug: true,
          updatedAt: true,
        },
      }),

      prisma.facility.findMany({
        select: {
          slug: true,
          updatedAt: true,
        },
      }),

      prisma.division.findMany({
        select: {
          slug: true,
          districts: {
            select: {
              slug: true,
              upazilas: {
                select: {
                  slug: true,
                },
              },
            },
          },
        },
      }),

      prisma.specialty.findMany({
        select: {
          slug: true,
        },
      }),
    ]);

    const doctorPages: MetadataRoute.Sitemap = doctors.map(
      (doctor) => ({
        url: `${siteUrl}/doctor/${doctor.slug}`,
        lastModified: doctor.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    const facilityPages: MetadataRoute.Sitemap = facilities.map(
      (facility) => ({
        url: `${siteUrl}/facility/${facility.slug}`,
        lastModified: facility.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    const locationPages: MetadataRoute.Sitemap =
      divisions.flatMap((division) => {
        const divisionPage: MetadataRoute.Sitemap[number] = {
          url: `${siteUrl}/division/${division.slug}`,
          lastModified: now,
          changeFrequency: "weekly",
          priority: 0.6,
        };

        const districtPages = division.districts.flatMap(
          (district) => {
            const districtPage: MetadataRoute.Sitemap[number] = {
              url: `${siteUrl}/division/${division.slug}/district/${district.slug}`,
              lastModified: now,
              changeFrequency: "weekly",
              priority: 0.5,
            };

            const upazilaPages =
              district.upazilas.map((upazila) => ({
                url: `${siteUrl}/division/${division.slug}/district/${district.slug}/upazila/${upazila.slug}`,
                lastModified: now,
                changeFrequency: "weekly" as const,
                priority: 0.4,
              }));

            return [districtPage, ...upazilaPages];
          }
        );

        return [divisionPage, ...districtPages];
      });

    const specialtyPages: MetadataRoute.Sitemap =
      specialties.map((specialty) => ({
        url: `${siteUrl}/search?specialty=${encodeURIComponent(
          specialty.slug
        )}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [
      ...staticPages,
      ...doctorPages,
      ...facilityPages,
      ...locationPages,
      ...specialtyPages,
    ];
  } catch (error) {
    const message =
      error instanceof Error ? error.message : String(error);
    const stack =
      error instanceof Error ? error.stack : undefined;

    console.error("[sitemap] generation failed", {
      message,
      stack,
      url: siteUrl,
      fallback: "staticPages",
    });

    if (stack) {
      console.error(stack);
    }

    // Always return valid sitemap XML even if database fails,
    // so Google does not record a "Couldn't fetch" error.
    return staticPages;
  }
}