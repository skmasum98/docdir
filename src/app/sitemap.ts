import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const siteUrl = (
  process.env.NEXTAUTH_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://drchamber.info"
).replace(/\/$/, "");

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/facilities`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${siteUrl}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/register`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${siteUrl}/forgot-password`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
  ];

  try {
    const [doctors, facilities, divisions, specialties] = await Promise.all([
      prisma.doctor.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.facility.findMany({
        select: { slug: true, updatedAt: true },
      }),
      prisma.division.findMany({
        include: {
          districts: {
            include: {
              upazilas: true,
            },
          },
        },
      }),
      prisma.specialty.findMany({
        select: { slug: true },
      }),
    ]);

    const doctorPages = doctors.map((doctor) => ({
      url: `${siteUrl}/doctor/${doctor.slug}`,
      lastModified: doctor.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const facilityPages = facilities.map((facility) => ({
      url: `${siteUrl}/facility/${facility.slug}`,
      lastModified: facility.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

    const locationPages = divisions.flatMap((division) => [
      {
        url: `${siteUrl}/division/${division.slug}`,
        lastModified: new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      },
      ...division.districts.flatMap((district) => [
        {
          url: `${siteUrl}/division/${division.slug}/district/${district.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.5,
        },
        ...district.upazilas.map((upazila) => ({
          url: `${siteUrl}/division/${division.slug}/district/${district.slug}/upazila/${upazila.slug}`,
          lastModified: new Date(),
          changeFrequency: "weekly" as const,
          priority: 0.4,
        })),
      ]),
    ]);

    const specialtyPages = specialties.map((specialty) => ({
      url: `${siteUrl}/search?specialty=${specialty.slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

    return [...staticPages, ...doctorPages, ...facilityPages, ...locationPages, ...specialtyPages];
  } catch (error) {
    console.error("Failed to generate sitemap.xml", error);
    return staticPages;
  }
}