import { prisma } from "@/lib/prisma";
import { deleteBlogAction } from "@/lib/actions/admin";
import BlogCreateForm from "./blog-form";

export const metadata = { title: "Blogs | Admin" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminBlogsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const [blogs, doctors] = await Promise.all([
    prisma.blog.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { name: true } },
        doctor: { select: { fullName: true } },
      },
    }),
    prisma.doctor.findMany({ orderBy: { fullName: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-slate-900">Blog posts</h1>
      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Saved successfully.
        </div>
      )}

      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-slate-900">New post</h2>
        <BlogCreateForm doctors={doctors.map((d) => ({ id: d.id, fullName: d.fullName }))} />
      </div>

      <div className="space-y-3">
        {blogs.map((b) => (
          <div key={b.id} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-slate-900">{b.title}</p>
                <p className="text-xs text-slate-500">
                  By {b.author?.name || "Admin"}
                  {b.doctor && ` · About ${b.doctor.fullName}`}
                  {" · "}
                  {b.createdAt.toLocaleDateString()}
                </p>
                {b.excerpt && <p className="mt-2 text-sm text-slate-700">{b.excerpt}</p>}
                <p className="mt-2 text-xs">
                  <span
                    className={`rounded-full px-2 py-1 ${
                      b.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-800"
                        : b.status === "ARCHIVED"
                        ? "bg-slate-100 text-slate-700"
                        : "bg-amber-50 text-amber-800"
                    }`}
                  >
                    {b.status}
                  </span>
                </p>
              </div>
              <form action={deleteBlogAction}>
                <input type="hidden" name="id" value={b.id} />
                <button
                  type="submit"
                  className="rounded-2xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50"
                >
                  Delete
                </button>
              </form>
            </div>
          </div>
        ))}
        {blogs.length === 0 && <p className="text-sm text-slate-500">No blog posts yet.</p>}
      </div>
    </div>
  );
}
