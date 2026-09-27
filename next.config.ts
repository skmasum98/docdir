import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  output: "standalone",
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-mariadb",
    "mariadb",
    "mysql2",
    "bcryptjs",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pic.thewebpal.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  // --- নতুন যোগ করা রিডাইরেক্ট অংশ ---
  async redirects() {
    return [
      {
        // এটি '/doctor/dr-dr-' দিয়ে শুরু হওয়া সব লিঙ্ক ধরবে
        source: '/doctor/dr-dr-:slug',
        // এটি অটোমেটিক 'dr-' দিয়ে নতুন লিঙ্ক তৈরি করবে
        destination: '/doctor/dr-:slug',
        // permanent: true মানে হলো এটি একটি 301 Redirect, যা SEO এর জন্য সবচেয়ে জরুরি
        permanent: true,
      },
    ];
  },
  // --------------------------------

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      {
        source: "/api/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
      {
        source: "/sitemap.xml",
        headers: [
          {
            key: "Content-Type",
            value: "application/xml; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
          {
            key: "Netlify-CDN-Cache-Control",
            value: "public, max-age=3600, must-revalidate",
          },
        ],
      },
    ];
  },
  compress: true,
  poweredByHeader: false,
};

export default nextConfig;