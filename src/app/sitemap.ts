import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";

const siteUrl = SITE_URL;

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

      // Only list facilities that actually have content (linked doctors or
      // active tests). Empty bulk-imported shells are thin pages — keep them
      // crawlable via internal links, but don't invite Google to index them.
      prisma.facility.findMany({
        select: {
          slug: true,
          updatedAt: true,
          _count: {
            select: {
              doctorFacilities: true,
              tests: { where: { isActive: true } },
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

    // NOTE: /division/*, /division/*/district/* and */upazila/* URLs are
    // intentionally NOT listed: those routes 307-redirect to /search?...,
    // and redirecting URLs in a sitemap trigger "3XX redirect in sitemap"
    // errors. The redirect pages keep working for shared/bookmarked links.

    const doctorPages: MetadataRoute.Sitemap = doctors.map(
      (doctor) => ({
        url: `${siteUrl}/doctor/${doctor.slug}`,
        lastModified: doctor.updatedAt,
        changeFrequency: "weekly",
        priority: 0.8,
      })
    );

    const facilityPages: MetadataRoute.Sitemap = facilities
      .filter((f) => f._count.doctorFacilities > 0 || f._count.tests > 0)
      .map(
        (facility) => ({
          url: `${siteUrl}/facility/${facility.slug}`,
          lastModified: facility.updatedAt,
          changeFrequency: "weekly",
          priority: 0.8,
        })
      );

    const specialtyPages: MetadataRoute.Sitemap =
      specialties.map((specialty) => ({
        url: `${siteUrl}/specialty/${specialty.slug}`,
        lastModified: now,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [
      ...staticPages,
      ...doctorPages,
      ...facilityPages,
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