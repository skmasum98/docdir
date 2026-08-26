import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ClaimForm from "./claim-form";
import {
  ShieldCheck,
  UserCheck,
  FileCheck,
  Clock,
  Sparkles,
  HelpCircle,
  PhoneCall,
  ChevronRight,
  Stethoscope,
  Building2,
  DollarSign,
  Lock,
} from "lucide-react";

export const metadata = { title: "Claim Doctor Profile | Doctor Directory" };

type Props = { searchParams: Promise<{ doctorId?: string }> };

export default async function ClaimPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/claim");

  const sp = await searchParams;
  const doctorId = sp.doctorId ? Number(sp.doctorId) : null;

  const doctors = await prisma.doctor.findMany({
    where: { profileClaimed: false, status: "PUBLISHED" },
    orderBy: { fullName: "asc" },
    select: { id: true, fullName: true, specialty: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-5xl px-4 sm:px-6 py-10 space-y-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link href="/dashboard" className="hover:text-slate-900 transition">
          Dashboard
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-medium text-slate-900">Claim Profile</span>
      </nav>

      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 rounded-xl bg-amber-100/70 px-3 py-1 text-xs font-bold text-amber-900 mb-2">
          <Sparkles className="h-3.5 w-3.5 text-amber-700" /> Doctor Verification Portal
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Claim Your Doctor Profile
        </h1>
        <p className="mt-1.5 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Verify your medical credentials to take full control of your public profile, consultation
          schedules, visiting chambers, and patient appointment requests.
        </p>
      </div>

      {/* Visual 4-Step Claiming Guide */}
      <div className="rounded-3xl border border-amber-200/80 bg-linear-to-br from-amber-50/70 via-white to-amber-50/30 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-amber-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/15 text-amber-800">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">How Profile Claiming Works</h2>
              <p className="text-xs text-slate-500">Fast, 4-step verification for certified doctors</p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
            100% Free for Doctors
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 font-bold text-xs text-indigo-700">
                1
              </span>
              <UserCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Search Doctor Record</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Find your name in the directory dropdown below. If pre-selected from your profile, it is ready.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 font-bold text-xs text-indigo-700">
                2
              </span>
              <FileCheck className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Submit BMDC Info</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Provide your official BMDC registration number and an optional image/photo of your doctor ID.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-50 font-bold text-xs text-indigo-700">
                3
              </span>
              <Clock className="h-4 w-4 text-indigo-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Admin Review</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Our medical credential team cross-checks your registration number. Processed within 12–24h.
            </p>
          </div>

          <div className="rounded-2xl bg-white p-4 border border-slate-200/80 shadow-2xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-emerald-50 font-bold text-xs text-emerald-700">
                4
              </span>
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <h3 className="text-xs font-bold text-slate-900">Full Dashboard Access</h3>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Gain instant access to edit visiting chambers, fees, hospital affiliations, and publish medical articles.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Claim Form & Doctor Benefits Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ClaimForm doctors={doctors} initialDoctorId={doctorId} />
        </div>

        {/* Benefits & Support Sidebar */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-indigo-600" />
              What You Unlock When Claimed
            </h3>
            <ul className="space-y-3 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <Building2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Link affiliated hospitals and manage chamber addresses & visiting hours.</span>
              </li>
              <li className="flex items-start gap-2">
                <DollarSign className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Set your consultation & follow-up fees transparently for patients.</span>
              </li>
              <li className="flex items-start gap-2">
                <Stethoscope className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Publish health tips & medical blogs visible to thousands of daily visitors.</span>
              </li>
              <li className="flex items-start gap-2">
                <Lock className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Lock your profile against unauthorized changes or duplicates.</span>
              </li>
            </ul>
          </div>

          {/* WhatsApp / Direct Support Card */}
          <div className="rounded-3xl border border-emerald-200 bg-emerald-50/60 p-6 space-y-3">
            <div className="flex items-center gap-2 text-emerald-950">
              <PhoneCall className="h-4 w-4 text-emerald-700" />
              <h4 className="text-sm font-bold">Fast-Track Verification</h4>
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Are you a practicing doctor needing urgent verification within 1 hour? Contact our verification team on WhatsApp.
            </p>
            <a
              href="https://wa.me/8801700000000?text=Hello%20Doctor%20Directory,%20I%20have%20submitted%20a%20profile%20claim%20and%20need%20urgent%20verification"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-emerald-700 transition"
            >
              WhatsApp Verification Desk →
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
