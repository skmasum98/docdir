import { redirect } from "next/navigation";
import RegisterForm from "./register-form";
import { auth } from "@/lib/auth";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | Doctor Directory Bangladesh",
  description: "Create your Doctor Directory account to review doctors, book appointments, or list your medical practice.",
  robots: { index: false, follow: true },
};

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <main className="mx-auto max-w-md px-4 sm:px-6 py-8 sm:py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
        <h1 className="text-xl sm:text-2xl font-semibold text-slate-900">Create your account</h1>
        <p className="mt-1 text-sm text-slate-600">
          Sign up to review doctors or list your practice.
        </p>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </main>
  );
}
