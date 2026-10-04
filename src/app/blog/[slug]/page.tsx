import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site-url";
import { UserAvatar } from "@/components/user-avatar";
import { BookOpen, CalendarDays, ChevronRight } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

// Prerender published posts + refresh hourly (edits revalidate on demand).
export const revalidate = 3600;

export async function generateStaticParams() {
  const posts = await prisma.blog.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true },
  });
  return posts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blog.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, content: true, status: true },
  });
  // Only published posts are indexable; drafts fall through to notFound below.
  if (!post || post.status !== "PUBLISHED") {
    return { title: "Article Not Found" };
  }

  const pageUrl = `${SITE_URL}/blog/${slug}`;
  const description = (post.excerpt?.trim() || post.content.trim())
    .replace(/\s+/g, " ")
    .slice(0, 160);
  return {
    title: post.title,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: post.title,
      description,
      url: pageUrl,
      siteName: "DrChamber",
      type: "article",
      locale: "en_BD",
    },
    twitter: { card: "summary", title: post.title, description },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const { slug } = await params;
  const post = await prisma.blog.findUnique({
    where: { slug },
    include: {
      doctor: {
        select: {
          fullName: true,
          slug: true,
          profilePhoto: true,
          specialty: { select: { name: true } },
        },
      },
    },
  });
  if (!post || post.status !== "PUBLISHED") notFound();

  const related = await prisma.blog.findMany({
    where: { status: "PUBLISHED", id: { not: post.id } },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    take: 3,
    select: { id: true, title: true, slug: true, excerpt: true },
  });

  const pageUrl = `${SITE_URL}/blog/${post.slug}`;
  const publishDate = post.publishedAt ?? post.createdAt;

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: (post.excerpt?.trim() || post.content.trim())
      .replace(/\s+/g, " ")
      .slice(0, 200),
    url: pageUrl,
    datePublished: publishDate.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    author: post.doctor
      ? {
          "@type": "Physician",
          name: post.doctor.fullName,
          url: `${SITE_URL}/doctor/${post.doctor.slug}`,
        }
      : { "@type": "Organization", name: "DrChamber" },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: pageUrl },
    ],
  };

  return (
    <main className="mx-auto w-full max-w-3xl min-w-0 px-3 py-5 sm:px-6 sm:py-8 space-y-5 sm:space-y-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <nav
        className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap pb-1 text-xs text-slate-500"
        aria-label="Breadcrumb"
      >
        <Link href="/" className="shrink-0 transition hover:text-slate-900">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        <Link href="/blog" className="shrink-0 transition hover:text-slate-900">
          Blog
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />
        <span className="max-w-[200px] truncate font-medium text-slate-900 sm:max-w-none">
          {post.title}
        </span>
      </nav>

      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:rounded-3xl sm:p-8">
        <p className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-[11px] font-bold text-purple-900">
          <BookOpen className="h-3.5 w-3.5" />
          Health Article
        </p>
        <h1 className="mt-2 break-words text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          {post.title}
        </h1>
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 sm:text-sm">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {publishDate.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </p>

        {post.doctor && (
          <Link
            href={`/doctor/${post.doctor.slug}`}
            className="mt-4 flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition hover:border-purple-200 hover:bg-purple-50/40"
          >
            <UserAvatar
              src={post.doctor.profilePhoto}
              name={post.doctor.fullName}
              size="md"
              className="shrink-0"
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-slate-900">
                {post.doctor.fullName}
              </span>
              <span className="block truncate text-xs text-slate-500">
                {post.doctor.specialty?.name ?? "Doctor"} — view profile & book serial
              </span>
            </span>
          </Link>
        )}

        {post.excerpt && (
          <p className="mt-4 border-l-4 border-purple-200 bg-purple-50/40 py-2 pl-4 break-words text-sm font-medium leading-6 text-slate-700 sm:text-base sm:leading-7">
            {post.excerpt}
          </p>
        )}

        <div className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-slate-700 sm:text-base sm:leading-7">
          {post.content}
        </div>
      </article>

      {related.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <h2 className="text-sm font-bold text-slate-900 sm:text-base">
            More health articles
          </h2>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/blog/${r.slug}`}
                className="block min-w-0 rounded-xl border border-slate-200 p-3 transition hover:border-purple-300 hover:bg-purple-50/30"
              >
                <span className="line-clamp-2 break-words text-xs font-bold text-slate-900 sm:text-sm">
                  {r.title}
                </span>
                {r.excerpt && (
                  <span className="mt-1 line-clamp-2 break-words text-[11px] text-slate-500">
                    {r.excerpt}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
