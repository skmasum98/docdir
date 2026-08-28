import { MetadataRoute } from "next";

const siteUrl = process.env.NEXTAUTH_URL || "https://doctordirectory.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/admin/",
          "/login",
          "/register",
          "/forgot-password",
          "/reset-password",
          "/api/",
          "/_next/",
          "/static/",
          "/*?*utm_*",
          "/*?*fbclid*",
          "/*?*gclid*",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}