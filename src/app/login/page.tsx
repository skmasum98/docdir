import { redirect } from "next/navigation";
import LoginForm from "./login-form";
import { auth } from "@/lib/auth";

export const metadata = { title: "Login | Doctor Directory" };

type Props = {
  searchParams: Promise<{
    registered?: string;
    callbackUrl?: string;
    error?: string;
    resetSuccess?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const sp = await searchParams;
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-600">Log in to manage your profile and reviews.</p>
        <div className="mt-6">
          <LoginForm
            registered={sp.registered === "1"}
            callbackUrl={sp.callbackUrl}
            resetSuccess={sp.resetSuccess === "1"}
          />
        </div>
      </div>
    </main>
  );
}
