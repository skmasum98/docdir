import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { UserAvatar } from "@/components/user-avatar";
import {
  FlaskConical,
  Search,
  ArrowRight,
  MapPin,
  BadgeCheck,
  ListOrdered,
  MonitorPlay,
  UserPlus,
  CalendarDays,
  BellRing,
  Building2,
  BarChart3,
  Stethoscope,
  CircleCheck,
  Gift,
  Network,
} from "lucide-react";

export default async function HomePage() {
  const [
    divisions,
    specialties,
    totalDoctors,
    totalFacilities,
    featuredDoctors,
    featuredFacilities,
  ] = await Promise.all([
    prisma.division.count(),
    prisma.specialty.count(),
    prisma.doctor.count({
      where: { status: "PUBLISHED" },
    }),
    prisma.facility.count(),
    prisma.doctor.findMany({
      where: {
        status: "PUBLISHED",
        isVerified: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 6,
      include: {
        specialty: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.facility.findMany({
      take: 4,
      orderBy: {
        doctorFacilities: {
          _count: "desc",
        },
      },
      include: {
        upazila: {
          include: {
            district: true,
          },
        },
        _count: {
          select: {
            doctorFacilities: true,
            tests: true,
          },
        },
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-5 sm:py-8 lg:px-6 lg:py-10">
      <div className="space-y-8 sm:space-y-10 lg:space-y-12">
        {/* ================= HERO — doctors & hospitals first ================= */}
        <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 p-5 text-white shadow-sm sm:rounded-3xl sm:p-8 lg:p-10">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(45,212,191,0.25),transparent_55%),radial-gradient(circle_at_10%_90%,rgba(99,102,241,0.25),transparent_50%)]"
          />
          <div className="relative max-w-4xl space-y-5 sm:space-y-6">
            {/* Free badge */}
            <div className="flex max-w-full flex-wrap items-center gap-2">
              <div className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-emerald-300/40 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold text-emerald-200 sm:px-3 sm:text-xs">
                <Gift className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  100% FREE for doctors &amp; hospitals — no fee, no commission
                </span>
              </div>
              <div className="inline-flex max-w-full items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white sm:px-3 sm:text-xs">
                <Network className="h-3.5 w-3.5 shrink-0 text-teal-200" />
                <span className="truncate">
                  Building Bangladesh&apos;s largest doctor network
                </span>
              </div>
            </div>

            <h1 className="max-w-3xl text-2xl font-extrabold leading-[1.2] tracking-tight sm:text-3xl lg:text-4xl xl:text-5xl">
              Free serial &amp; chamber management for doctors and hospitals
            </h1>

            <p className="max-w-2xl text-sm leading-6 text-slate-300 sm:text-base sm:leading-7">
              Join the movement to build the largest doctor network and
              directory in Bangladesh. Publish your profile, manage live
              patient serials, run the receptionist queue and send SMS
              reminders — absolutely free for all.
            </p>

            {/* CTAs */}
            <div className="flex flex-col gap-2.5 pt-1 sm:flex-row sm:gap-3">
              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-bold text-slate-950 shadow-sm transition hover:bg-emerald-300 sm:w-auto"
              >
                <Stethoscope className="h-4 w-4 shrink-0" />
                <span>Register as Doctor — Free</span>
              </Link>

              <Link
                href="/register"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-white/20 sm:w-auto"
              >
                <Building2 className="h-4 w-4 shrink-0" />
                <span>Add Hospital — Free</span>
              </Link>

              <Link
                href="/search"
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 sm:w-auto"
              >
                <Search className="h-4 w-4 shrink-0" />
                <span>Find Doctors</span>
              </Link>
            </div>

            {/* Trust chips */}
            <ul className="flex flex-wrap gap-1.5 pt-1 text-[11px] font-semibold sm:text-xs">
              {[
                "0৳ forever — no setup fee",
                "No commission on visits",
                "Live queue & calling",
                "SMS serial reminders",
              ].map((t) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-slate-200"
                >
                  <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-300" />
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ================= STATS ================= */}
        <section className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
          <Stat
            label="Listed doctors"
            value={totalDoctors}
            href="/search"
          />

          <Stat
            label="Specialties"
            value={specialties}
            href="/search"
          />

          <Stat
            label="Hospitals & Centers"
            value={totalFacilities}
            href="/facilities"
            highlight
          />

          <Stat
            label="Divisions Covered"
            value={divisions}
            href="/facilities"
          />
        </section>

        {/* ================= LARGEST NETWORK VISION ================= */}
        <section className="relative overflow-hidden rounded-2xl border border-teal-200 bg-gradient-to-br from-teal-50 via-white to-indigo-50 p-5 shadow-sm sm:rounded-3xl sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0 max-w-2xl">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-teal-200 bg-white px-3 py-1 text-[11px] font-bold text-teal-900">
                <Network className="h-3.5 w-3.5 text-teal-700" />
                OUR MISSION
              </p>
              <h2 className="mt-2 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl lg:text-3xl">
                Building the largest doctor network &amp; directory in
                Bangladesh
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base sm:leading-7">
                Every division, every district, every specialty — one free
                national network where patients find the right doctor and every
                doctor and hospital manages serials effortlessly. When you join
                free, you make the network stronger for all of Bangladesh.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] font-semibold sm:text-xs">
                {[
                  `${divisions} divisions connected`,
                  `${specialties} specialties`,
                  `${totalDoctors} doctors already listed`,
                  `${totalFacilities} hospitals & centers`,
                ].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-slate-700"
                  >
                    <CircleCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Join the network — Free
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/search"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-teal-300 bg-white px-6 py-3 text-sm font-bold text-teal-900 transition hover:bg-teal-50"
              >
                <Search className="h-4 w-4" />
                Explore the directory
              </Link>
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS ================= */}
        <section className="space-y-4 sm:space-y-5">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              For doctors &amp; hospitals
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Go live in 3 steps — free
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
              No paperwork, no payment. Create your presence and start taking
              serials today.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-3">
            <StepCard
              step="1"
              title="Create your free profile"
              text="Register as a doctor or hospital, add degrees, BMDC number, chamber address and consultation fee."
            />
            <StepCard
              step="2"
              title="Add chamber schedules"
              text="Set visiting days, time slots and serial limits per chamber. Auto-generate daily slots for every facility."
            />
            <StepCard
              step="3"
              title="Take serials & call queue"
              text="Patients book online. Your receptionist books walk-ins, calls next serial live and marks no-shows."
            />
          </div>
        </section>

        {/* ================= SERIAL MANAGEMENT FEATURES ================= */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
                Serial management system
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Everything a chamber needs — free
              </h2>
              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                Built for busy chambers in Bangladesh: online + offline serials
                in one live queue.
              </p>
            </div>

            <Link
              href="/register"
              className="inline-flex shrink-0 items-center gap-1 self-start rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 sm:self-auto"
            >
              <span>Start free now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            <FeatureCard
              icon={<ListOrdered className="h-5 w-5 text-emerald-700" />}
              title="Online + walk-in serials"
              text="Patients book serials online with live numbers. Receptionists add walk-ins to the same queue."
            />
            <FeatureCard
              icon={<MonitorPlay className="h-5 w-5 text-emerald-700" />}
              title="Live queue & calling"
              text="See today's queue, call next patient, track in-progress visits and queue progress in real time."
            />
            <FeatureCard
              icon={<UserPlus className="h-5 w-5 text-emerald-700" />}
              title="Receptionist portal"
              text="Give chamber staff their own login to manage bookings, cancellations and no-shows per schedule."
            />
            <FeatureCard
              icon={<CalendarDays className="h-5 w-5 text-emerald-700" />}
              title="Multi-chamber schedules"
              text="Manage multiple hospitals, chambers and shifts with per-day slots, limits and notes."
            />
            <FeatureCard
              icon={<BellRing className="h-5 w-5 text-emerald-700" />}
              title="SMS confirmations"
              text="Automatic booking confirmations, live queue alerts and serial reminders for patients."
            />
            <FeatureCard
              icon={<BadgeCheck className="h-5 w-5 text-emerald-700" />}
              title="Verified doctor profile"
              text="BMDC-checked badge, degrees, fees and chamber times on a public page patients trust."
            />
            <FeatureCard
              icon={<BarChart3 className="h-5 w-5 text-emerald-700" />}
              title="Chamber dashboard"
              text="Today's patients, upcoming bookings and history at a glance for doctors and managers."
            />
            <FeatureCard
              icon={<FlaskConical className="h-5 w-5 text-emerald-700" />}
              title="Hospital + test listings"
              text="Hospitals list doctors, departments and diagnostic test prices to attract more patients."
            />
          </div>
        </section>

        {/* ================= FREE FOREVER BAND ================= */}
        <section className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-sm sm:rounded-3xl sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-1.5 rounded-full border border-emerald-300 bg-white px-3 py-1 text-[11px] font-bold text-emerald-800">
                <Gift className="h-3.5 w-3.5" />
                FREE FOREVER — 0৳
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Absolutely free for all doctors and hospitals
              </h2>
              <ul className="mt-2 grid grid-cols-1 gap-1.5 text-sm text-slate-700 sm:grid-cols-2">
                {[
                  "Unlimited serials & appointments",
                  "Live queue + receptionist logins",
                  "Doctor & hospital public pages",
                  "SMS alerts & reminders",
                ].map((t) => (
                  <li key={t} className="flex items-start gap-1.5">
                    <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Link
                href="/register"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Claim your free profile
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-300 bg-white px-6 py-3 text-sm font-bold text-emerald-900 transition hover:bg-emerald-100"
              >
                Login to dashboard
              </Link>
            </div>
          </div>
        </section>

        {/* ================= FACILITIES ================= */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Hospitals &amp; Diagnostic Centers
              </h2>

              <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500 sm:text-sm">
                List your hospital free — add doctors, departments &amp; test
                prices to get discovered.
              </p>
            </div>

            <Link
              href="/facilities"
              className="inline-flex shrink-0 items-center gap-1 self-start text-xs font-bold text-teal-800 transition hover:text-teal-950 sm:self-auto"
            >
              <span>Explore all ({totalFacilities})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {featuredFacilities.map((f) => (
              <Link
                key={f.id}
                href={`/facility/${f.slug}`}
                className="group flex min-w-0 flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-300 hover:shadow-md sm:rounded-3xl sm:p-5"
              >
                <div className="min-w-0 space-y-2.5">
                  {/* Type + Doctors */}
                  <div className="flex min-w-0 items-center justify-between gap-2">
                    <span className="inline-flex min-w-0 max-w-[65%] items-center gap-1 rounded-lg border border-teal-200 bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                      <FlaskConical className="h-3 w-3 shrink-0" />
                      <span className="truncate">{f.type}</span>
                    </span>

                    <span className="shrink-0 text-[10px] font-semibold text-slate-500 sm:text-[11px]">
                      {f._count.doctorFacilities} Doctors
                    </span>
                  </div>

                  {/* Facility name */}
                  <h3 className="truncate text-sm font-bold text-slate-900 transition group-hover:text-teal-700 sm:text-base">
                    {f.name}
                  </h3>

                  {/* Location */}
                  <p className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />

                    <span className="truncate">
                      {f.upazila?.name || "General"}
                      {f.upazila?.district?.name
                        ? `, ${f.upazila.district.name}`
                        : ""}
                    </span>
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-[11px] font-semibold text-teal-800 sm:text-xs">
                  <span className="truncate">View Tests & Doctors</span>

                  <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ================= DOCTORS ================= */}
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              Featured Verified Doctors
            </h2>

            <Link
              href="/search"
              className="inline-flex items-center gap-1 self-start text-xs font-bold text-slate-700 transition hover:text-slate-900 sm:self-auto"
            >
              <span>View all doctors</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {featuredDoctors.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center sm:rounded-3xl">
              <p className="text-sm font-semibold text-slate-900">
                Be the first doctor listed here — free
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Register now and your verified profile will appear to thousands
                of patients.
              </p>
              <Link
                href="/register"
                className="mt-3 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Register free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
              {featuredDoctors.map((d) => (
                <Link
                  key={d.id}
                  href={`/doctor/${d.slug}`}
                  className="group flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-slate-300 hover:shadow-md sm:gap-4 sm:rounded-3xl sm:p-5 lg:p-6"
                >
                  <UserAvatar
                    src={d.profilePhoto}
                    name={d.fullName}
                    size="lg"
                    className="shrink-0 shadow-sm ring-2 ring-slate-100"
                  />

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-indigo-600 sm:text-base lg:text-lg">
                      {d.fullName}
                    </p>

                    <p className="mt-1 truncate text-xs text-slate-600 sm:text-sm">
                      {d.specialty?.name ?? "General practitioner"}
                      {d.consultationFee !== null &&
                        ` · ৳${d.consultationFee}`}
                    </p>

                    {d.city && (
                      <p className="mt-1 truncate text-[11px] text-slate-500 sm:text-xs">
                        {d.city}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ================= FINAL CTA ================= */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 text-center shadow-sm sm:rounded-3xl sm:p-8">
          <p className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
            <Network className="h-3.5 w-3.5 text-teal-700" />
            Bangladesh&apos;s largest doctor network — in the making
          </p>
          <h2 className="mx-auto mt-2 max-w-2xl text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
            Doctors &amp; hospitals — run your entire chamber free
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
            Join in minutes. No fee, no commission, no hidden charges —
            absolutely free for all.
          </p>
          <div className="mt-4 flex flex-col justify-center gap-2 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-slate-950 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              Get started free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/search"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Search className="h-4 w-4" />
              Browse as patient
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

/* ================= STAT CARD ================= */

function Stat({
  label,
  value,
  href,
  highlight,
}: {
  label: string;
  value: number;
  href?: string;
  highlight?: boolean;
}) {
  const content = (
    <div
      className={`h-full rounded-2xl border p-4 shadow-sm transition sm:rounded-3xl sm:p-5 lg:p-6 ${
        highlight
          ? "border-teal-200 bg-teal-50/60 hover:bg-teal-50"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-500 sm:text-[10px]">
        {label}
      </p>

      <p
        className={`mt-1.5 text-2xl font-extrabold leading-none sm:mt-2 sm:text-3xl ${
          highlight ? "text-teal-950" : "text-slate-900"
        }`}
      >
        {value}
      </p>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="block min-w-0 rounded-2xl focus-visible:outline-none"
      >
        {content}
      </Link>
    );
  }

  return content;
}

function StepCard({
  step,
  title,
  text,
}: {
  step: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
      <p className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-slate-950 text-sm font-bold text-white">
        {step}
      </p>
      <h3 className="mt-3 text-sm font-bold text-slate-900 sm:text-base">
        {title}
      </h3>
      <p className="mt-1 text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6">
        {text}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:rounded-3xl sm:p-5">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-bold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-slate-500">{text}</p>
    </div>
  );
}
