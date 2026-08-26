import { prisma } from "@/lib/prisma";
import { deleteUserAction } from "@/lib/actions/admin";
import UserEditForm from "./user-form";
import { UserAvatar } from "@/components/user-avatar";

export const metadata = { title: "Users | Admin" };

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function AdminUsersPage({ searchParams }: Props) {
  const sp = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-900">User Management</h1>
        <p className="mt-1 text-sm text-slate-600">
          Manage user accounts, roles, permissions, and profile pictures.
        </p>
      </div>

      {sp.saved === "1" && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          User changes saved successfully.
        </div>
      )}
      <div className="space-y-3">
        {users.map((u) => (
          <details
            key={u.id}
            className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
          >
            <summary className="cursor-pointer list-none">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <UserAvatar src={u.image} name={u.name} size="md" />
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                    <p className="text-xs text-slate-500 truncate">{u.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      u.role === "ADMIN"
                        ? "bg-emerald-50 text-emerald-800"
                        : u.role === "DOCTOR"
                        ? "bg-indigo-50 text-indigo-800"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {u.role}
                  </span>
                  {!u.isActive && (
                    <span className="rounded-full bg-rose-50 px-3 py-1 text-xs text-rose-800">
                      Disabled
                    </span>
                  )}
                  <span className="text-xs text-slate-400 font-medium pl-1 group-open:rotate-180 transition-transform">
                    ▼
                  </span>
                </div>
              </div>
            </summary>
            <div className="mt-4 border-t border-slate-200 pt-4">
              <UserEditForm
                user={{
                  id: u.id,
                  name: u.name,
                  email: u.email,
                  phone: u.phone,
                  image: u.image,
                  role: u.role,
                  isActive: u.isActive,
                  createdAt: u.createdAt,
                }}
              />
              <form action={deleteUserAction} className="mt-4">
                <input type="hidden" name="id" value={u.id} />
                <button
                  type="submit"
                  className="rounded-2xl border border-rose-200 px-3.5 py-2 text-xs font-medium text-rose-700 hover:bg-rose-50 transition"
                >
                  Delete user
                </button>
              </form>
            </div>
          </details>
        ))}
        {users.length === 0 && (
          <p className="text-sm text-slate-500">No users found.</p>
        )}
      </div>
    </div>
  );
}
