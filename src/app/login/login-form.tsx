"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function LoginForm({
  registered,
  callbackUrl,
  resetSuccess,
}: {
  registered?: boolean;
  callbackUrl?: string;
  resetSuccess?: boolean;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const trimmedEmail = email.trim().toLowerCase();

    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid email or password. Please check your credentials.");
        setPending(false);
      } else {
        const dest = callbackUrl || "/";
        window.location.href = dest;
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setPending(false);
    }
  }

  function fillAdmin() {
    setEmail("admin@doctordirectory.com");
    setPassword("Admin123@");
    setError(null);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {registered && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Account created successfully! Please sign in with your credentials.
        </div>
      )}
      {resetSuccess && (
        <div className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          Your password has been reset successfully! Please sign in with your new password.
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-900">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email Address</label>
        <input
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="your.email@example.com"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium text-slate-700">Password</label>
          <Link
            href="/forgot-password"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
          placeholder="••••••••"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2.5 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>

      {/* <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600">
        <div className="flex items-center justify-between">
          <span>Admin Account:</span>
          <button
            type="button"
            onClick={fillAdmin}
            className="font-medium text-emerald-700 underline hover:text-emerald-900"
          >
            Auto-fill Super Admin
          </button>
        </div>
      </div> */}

      <p className="text-center text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-slate-900 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
