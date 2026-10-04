import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { BookOpen, CalendarDays, Stethoscope, ChevronRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Health Articles & Medical Blogs",
  description:
    "Read health articles, medical guidance and wellness tips from verified doctors in Bangladesh.",
  alternates: {
    canonical: `${SITE_URL}/blog`,
  },
};

// Prerender + refresh hourly (blog edits revalidate on demand).
export const revalidate = 3600;

export default async function BlogIndexPage() {
  const posts = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      publishedAt: true,
      createdAt: true,
      doctor: { select: { fullName: true, slug: true } },
    },
  });

  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 px-3 py-5 sm:px-6 sm:py-8 space-y-5 sm:space-y-6">
      <nav
        className="flex items-center gap-1.5 text-xs text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="transition hover:text-slate-900">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="font-medium text-slate-900">Blog</span>
      </nav>

      <header>
        <p className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-900">
          <BookOpen className="h-3.5 w-3.5" />
          Health Library
        </p>
        <h1 className="mt-2 max-w-3xl break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Health Articles & Medical Blogs
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
          Practical medical guidance and wellness tips from verified doctors
          across Bangladesh — {posts.length} article{posts.length === 1 ? "" : "s"}.
        </p>
      </header>

      {posts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:rounded-3xl sm:p-12">
          <BookOpen className="mx-auto h-10 w-10 text-slate-300" />
          <h2 className="mt-3 text-base font-semibold text-slate-900">
            No articles published yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Check back soon — or browse our doctors meanwhile.
          </p>
          <Link
            href="/search"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Find Doctors
          </Link>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
          {posts.map((p) => (
            <Link
              key={p.id}
              href={`/blog/${p.slug}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-purple-300 hover:shadow-md sm:rounded-3xl sm:p-5"
            >
              <h2 className="break-words text-base font-bold leading-snug text-slate-900 transition-colors group-hover:text-purple-700">
                {p.title}
              </h2>
              {p.excerpt && (
                <p className="mt-1.5 line-clamp-3 break-words text-xs leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  {p.excerpt}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-slate-100 pt-3 text-[11px] text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3 w-3" />
                  {(p.publishedAt ?? p.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                {p.doctor && (
                  <span className="inline-flex min-w-0 items-center gap-1 font-medium text-slate-700">
                    <Stethoscope className="h-3 w-3 shrink-0" />
                    <span className="truncate">{p.doctor.fullName}</span>
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
