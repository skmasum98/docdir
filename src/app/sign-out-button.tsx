"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
    >
      Sign out
    </button>
  );
}
