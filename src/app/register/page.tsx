import { redirect } from "next/navigation";
import RegisterForm from "./register-form";
import { auth } from "@/lib/auth";

export const metadata = { title: "Register | Doctor Directory" };

export default async function RegisterPage() {
  const session = await auth();
  if (session?.user) redirect("/");
  return (
    <main className="mx-auto max-w-md px-6 py-12">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">Create your account</h1>
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
