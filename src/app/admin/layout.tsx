import Link from "next/link";
import { requireAdmin } from "@/lib/auth-helpers";

const navItems = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/doctors", label: "Doctors" },
  { href: "/admin/doctors/import", label: "⚡ Bulk Import" },
  { href: "/admin/specialties", label: "Specialties" },
  { href: "/admin/facilities", label: "Facilities" },
  { href: "/admin/regions", label: "Regions" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/claims", label: "Claims" },
  { href: "/admin/blogs", label: "Blogs" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 lg:flex-row">
      <aside className="lg:w-56">
        <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Admin
          </p>
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <section className="flex-1">{children}</section>
    </div>
  );
}
