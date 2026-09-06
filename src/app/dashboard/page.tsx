import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/lib/enums";
import { getTodayDhaka, dhakaDateToUTC, formatDhakaDate, formatDhakaTime } from "@/lib/timezone";
import { getQueueInfo } from "@/lib/queue-manager";
import UserReviews from "./user-reviews";
import {
  Building2,
  Stethoscope,
  ShieldCheck,
  ChevronRight,
  FlaskConical,
  UserCheck,
  Calendar,
  Users,
  MessageSquare,
  Clock,
  ExternalLink,
  MapPin,
  Sparkles,
  Star,
  Play,
  Edit3,
  Settings,
} from "lucide-react";

export const metadata = {
  title: "Dashboard | Doctor Directory Bangladesh",
  description: "Manage your medical practice, chamber appointments, hospital facilities, and patient care.",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ saved?: string }> };

export default async function DashboardPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = Number(session.user.id);
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!currentUser) redirect("/login");

  const role = currentUser.role;
  const sp = await searchParams;
  const saved = sp.saved === "1";

  // 1. If user is a receptionist, redirect to dedicated receptionist dashboard
  const receptionist = await prisma.receptionist.findUnique({
    where: { userId: currentUser.id },
    include: { doctor: { select: { fullName: true } } },
  });

  if (receptionist && receptionist.isActive) {
    redirect("/dashboard/receptionist-dashboard");
  }

  // 2. Check for facilities owned/managed by this user
  const userFacilities = await prisma.facility.findMany({
    where: { userId: currentUser.id },
    include: {
      tests: { select: { id: true } },
      doctorFacilities: { select: { id: true } },
    },
  });

  const todayDhaka = getTodayDhaka();
  const todayUTC = dhakaDateToUTC(todayDhaka);

  // -------------------------------------------------------------
  // DOCTOR / ADMIN DASHBOARD VIEW
  // -------------------------------------------------------------
  if (role === UserRole.DOCTOR || (role === UserRole.ADMIN && !userFacilities.length)) {
    const doctor = await prisma.doctor.findFirst({
      where: { userId: currentUser.id },
      include: {
        specialty: true,
        doctorFacilities: {
          include: {
            facility: {
              include: {
                upazila: {
                  include: {
                    district: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (doctor) {
      // Get today's slots for this doctor
      const todaySlots = await prisma.scheduleSlot.findMany({
        where: {
          doctorId: doctor.id,
          slotDate: todayUTC,
        },
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              type: true,
              address: true,
            },
          },
          schedule: {
            select: {
              id: true,
              startTime: true,
              endTime: true,
              notes: true,
            },
          },
          appointment: {
            include: {
              patient: { select: { id: true, name: true, phone: true } },
            },
          },
        },
        orderBy: [{ startTime: "asc" }, { serialNumber: "asc" }],
      });

      // Upcoming bookings count
      const futureSlotsCount = await prisma.scheduleSlot.count({
        where: {
          doctorId: doctor.id,
          slotDate: { gt: todayUTC },
          status: "BOOKED",
        },
      });

      // Active receptionists count
      const receptionistsCount = await prisma.receptionist.count({
        where: { doctorId: doctor.id, isActive: true },
      });

      // Active schedules count & schedules list
      const doctorSchedules = await prisma.schedule.findMany({
        where: { doctorId: doctor.id, isActive: true },
        include: { facility: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });

      // Doctor Reviews
      const doctorReviews = await prisma.review.findMany({
        where: { doctorId: doctor.id },
        orderBy: { createdAt: "desc" },
        take: 5,
      });

      const totalReviews = doctorReviews.length;
      const avgRating =
        totalReviews > 0
          ? (doctorReviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
          : null;

      // SMS Balance
      const smsBalance = await prisma.smsBalance.findUnique({
        where: { userId: currentUser.id },
      });

      // Today's queue calculations
      const totalTodaySlots = todaySlots.length;
      const bookedTodaySlots = todaySlots.filter(
        (s) =>
          s.appointment &&
          s.appointment.status !== "CANCELLED" &&
          s.appointment.status !== "NO_SHOW"
      );
      const completedTodaySlots = todaySlots.filter(
        (s) => s.appointment?.status === "COMPLETED"
      );
      const inProgressSlot = todaySlots.find(
        (s) => s.appointment?.status === "IN_PROGRESS"
      );
      const nextUpSlot = todaySlots.find(
        (s) =>
          s.appointment &&
          (s.appointment.status === "SCHEDULED" || s.appointment.status === "CONFIRMED")
      );

      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

      return (
        <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-5 sm:space-y-6">
          {saved && (
            <div
              className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
              role="alert"
            >
              Saved successfully.
            </div>
          )}

          {/* SIMPLE HEADER — who am I + 1 primary action */}
          <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs">
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {doctor.profilePhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={doctor.profilePhoto}
                    alt={doctor.fullName}
                    className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border-2 border-indigo-100"
                  />
                ) : (
                  <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-indigo-50 border-2 border-indigo-100 text-indigo-700 font-bold text-xl">
                    {doctor.fullName.charAt(0)}
                  </div>
                )}
                {doctor.bmdcNumber && (
                  <span
                    title={`Verified BMDC: ${doctor.bmdcNumber}`}
                    className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-500">
                  {formatDhakaDate(todayUTC, { weekday: "long", day: "numeric", month: "short" })}
                </p>
                <h1 className="truncate text-lg sm:text-xl font-bold text-slate-900">
                  Assalamu Alaikum, Dr. {doctor.fullName.replace(/^Dr\.?\s*/i, "")}
                </h1>
                <p className="truncate text-xs sm:text-sm text-slate-600">
                  {bookedTodaySlots.length > 0
                    ? `Today: ${bookedTodaySlots.length} patients • ${completedTodaySlots.length} done`
                    : totalTodaySlots > 0
                      ? "No patients booked yet today"
                      : "No chamber today"}
                  {doctor.specialty ? ` • ${doctor.specialty.name}` : ""}
                </p>
              </div>
            </div>

            {/* ONE big action — today's queue */}
            <Link
              href="/dashboard/queue"
              className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3.5 text-base font-bold text-white transition hover:bg-indigo-700 active:scale-[0.99]"
            >
              <Play className="h-5 w-5" />
              {totalTodaySlots > 0 ? "Open Today's Patients" : "Open Queue & Schedules"}
            </Link>

            {/* Now / Next — plain language, only when relevant */}
            {totalTodaySlots > 0 && (
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                    Now seeing
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {inProgressSlot
                      ? `Serial #${inProgressSlot.serialNumber} — ${inProgressSlot.appointment?.patientName}`
                      : "Nobody in room yet"}
                  </p>
                </div>
                <div className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-amber-700">
                    Next patient
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900">
                    {nextUpSlot
                      ? `Serial #${nextUpSlot.serialNumber} — ${nextUpSlot.appointment?.patientName}`
                      : bookedTodaySlots.length > 0
                        ? "All done for today ✓"
                        : "No bookings yet"}
                  </p>
                </div>
              </div>
            )}

            {bookedTodaySlots.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs font-medium text-slate-600">
                  <span>
                    {completedTodaySlots.length} of {bookedTodaySlots.length} done
                  </span>
                  <span>
                    {Math.round((completedTodaySlots.length / bookedTodaySlots.length) * 100)}%
                  </span>
                </div>
                <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{
                      width: `${(completedTodaySlots.length / bookedTodaySlots.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            {totalTodaySlots === 0 && (
              <Link
                href="/dashboard/schedules"
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-300 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Calendar className="h-4 w-4" />
                Set chamber days & times
              </Link>
            )}
          </section>

          {/* 3 BIG BUTTONS — the only things most doctors need daily */}
          <section>
            <h2 className="mb-2 text-sm font-bold text-slate-900">
              What do you want to do?
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/dashboard/queue"
                className="flex min-h-24 items-center gap-4 rounded-3xl border-2 border-indigo-200 bg-indigo-50/50 p-5 transition hover:border-indigo-400 hover:bg-indigo-50 active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                  <Users className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-bold text-slate-900">
                    Today&apos;s Patients
                  </span>
                  <span className="block text-xs text-slate-600">
                    {bookedTodaySlots.length} booked today
                    {futureSlotsCount > 0 && ` • ${futureSlotsCount} later`} • call next, walk-ins
                  </span>
                </span>
              </Link>

              <Link
                href="/dashboard/schedules"
                className="flex min-h-24 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
                  <Calendar className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-bold text-slate-900">
                    My Chambers
                  </span>
                  <span className="block text-xs text-slate-600">
                    {doctorSchedules.length} active shift{doctorSchedules.length !== 1 ? "s" : ""} • days & times
                  </span>
                </span>
              </Link>

              <Link
                href="/dashboard/receptionists"
                className="flex min-h-24 items-center gap-4 rounded-3xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-sm active:scale-[0.99]"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-700 text-white">
                  <UserCheck className="h-6 w-6" />
                </span>
                <span>
                  <span className="block text-base font-bold text-slate-900">
                    My Staff
                  </span>
                  <span className="block text-xs text-slate-600">
                    {receptionistsCount} helper{receptionistsCount !== 1 ? "s" : ""} • they handle serials for you
                  </span>
                </span>
              </Link>
            </div>
          </section>

          {/* SECONDARY — smaller, less urgent */}
          <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <p className="px-1 text-xs font-bold uppercase tracking-wide text-slate-400">
              More Settings & Info
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Link
                href={`/doctor/${doctor.slug}`}
                target="_blank"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                My public page
              </Link>
              <Link
                href="/dashboard/profile"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Edit3 className="h-3.5 w-3.5" />
                Edit profile
              </Link>
              <Link
                href="/dashboard/sms"
                className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                SMS ({smsBalance ? Math.max(0, smsBalance.totalCredits - smsBalance.usedCredits) : 0})
              </Link>
              <span className="flex min-h-11 items-center justify-center gap-1.5 rounded-xl bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                {avgRating ? `${avgRating} ★ (${totalReviews})` : "No reviews yet"}
              </span>
            </div>
            {(doctor.consultationFee ?? 0) > 0 && (
              <p className="mt-2 px-1 text-xs text-slate-500">
                Fee: ৳{doctor.consultationFee}
                {(doctor.followUpFee ?? 0) > 0 && ` • Follow-up: ৳${doctor.followUpFee}`}
                {doctor.bmdcNumber && ` • BMDC: ${doctor.bmdcNumber}`} —{" "}
                <Link href="/dashboard/profile" className="font-bold text-indigo-600 hover:underline">
                  change
                </Link>
              </p>
            )}
          </section>

          {/* CHAMBERS DETAIL — collapsed by default */}
          <details className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
              <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-indigo-600" />
                My chamber days & times ({doctorSchedules.length})
              </span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
            </summary>

            {doctorSchedules.length > 0 ? (
              <div className="mt-3 grid grid-cols-1 gap-2">
                {doctorSchedules.slice(0, 4).map((sch) => (
                  <div
                    key={sch.id}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">
                        {dayNames[sch.dayOfWeek]} • {sch.startTime} – {sch.endTime}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {sch.facility?.name || doctor.hospitalName || "Chamber"} • max {sch.maxPatients}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                  </div>
                ))}
                {doctorSchedules.length > 4 && (
                  <p className="px-1 text-xs text-slate-500">
                    + {doctorSchedules.length - 4} more shifts
                  </p>
                )}
                <Link
                  href="/dashboard/schedules"
                  className="flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-700"
                >
                  Change days & times
                </Link>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl bg-slate-50 p-5 text-center">
                <p className="text-xs font-semibold text-slate-700">
                  No chamber days set yet.
                </p>
                <Link
                  href="/dashboard/schedules"
                  className="mt-2 inline-flex min-h-11 items-center gap-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-700"
                >
                  Add chamber days →
                </Link>
              </div>
            )}
          </details>

          {/* REVIEWS — collapsed, doctors rarely need this daily */}
          {doctorReviews.length > 0 && (
            <details className="group rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
              <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 [&::-webkit-details-marker]:hidden">
                <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  Patient reviews ({totalReviews}
                  {avgRating ? ` • ${avgRating} ★` : ""})
                </span>
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform group-open:rotate-90" />
              </summary>
              <div className="mt-3 space-y-2">
                {doctorReviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < rev.rating
                                ? "text-amber-500 fill-amber-400"
                                : "text-slate-200"
                            }`}
                          />
                        ))}
                        <span className="ml-1.5 text-xs font-bold text-slate-700">
                          {rev.rating}.0
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDhakaDate(rev.createdAt, { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                    {rev.comment && (
                      <p className="mt-1 text-xs italic leading-relaxed text-slate-700">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </details>
          )}
        </main>
      );
    } else {
      // Admin without doctor profile or Doctor with unclaimed profile
      return (
        <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center space-y-4">
            <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700">
              <Stethoscope className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">Doctor Profile Not Linked</h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              No verified doctor profile is linked to your account yet. You can find and claim your existing listing or request a new doctor profile.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Link
                href="/search"
                className="rounded-2xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Find & Claim Doctor Profile
              </Link>
              <Link
                href="/dashboard/profile"
                className="rounded-2xl border border-slate-300 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
              >
                Account Settings
              </Link>
            </div>
          </div>
        </main>
      );
    }
  }

  // -------------------------------------------------------------
  // FACILITY ADMIN DASHBOARD VIEW
  // -------------------------------------------------------------
  if (role === UserRole.FACILITY_ADMIN || userFacilities.length > 0) {
    return (
      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hospital & Clinic Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Manage your medical facilities, hotlines, diagnostic test catalogs, and doctor rosters.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/profile"
              className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
            >
              <Settings className="h-3.5 w-3.5" />
              Account Settings
            </Link>
            <Link
              href="/dashboard/facility"
              className="inline-flex items-center gap-2 rounded-2xl bg-teal-700 px-5 py-2 text-xs font-bold text-white hover:bg-teal-800 transition shadow-xs shrink-0"
            >
              <Building2 className="h-4 w-4" />
              Open Facility Suite
            </Link>
          </div>
        </div>

        {saved && (
          <div
            className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
            role="alert"
          >
            Changes saved successfully.
          </div>
        )}

        {/* Facility Cards */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-700" />
            Your Managed Medical Facilities ({userFacilities.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {userFacilities.map((fac) => (
              <div
                key={fac.id}
                className="rounded-3xl border border-teal-200 bg-white p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <span className="rounded-lg bg-teal-100 px-2 py-0.5 text-[11px] font-bold text-teal-800 uppercase">
                    {fac.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-2">{fac.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Hotline: {fac.hotline || fac.phone || "Not set"}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5 text-teal-600" />
                      {fac.tests.length} Tests
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                      {fac.doctorFacilities.length} Doctors
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100">
                  <Link
                    href={`/facility/${fac.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900"
                  >
                    View Public Page
                  </Link>
                  <Link
                    href={`/dashboard/facility`}
                    className="rounded-xl bg-teal-700 px-3.5 py-1.5 text-xs font-bold text-white hover:bg-teal-800 transition"
                  >
                    Manage Suite →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // -------------------------------------------------------------
  // PATIENT / STANDARD USER DASHBOARD VIEW
  // -------------------------------------------------------------
  const patientAppointments = await prisma.appointment.findMany({
    where: { patientId: currentUser.id },
    include: {
      doctor: {
        select: {
          fullName: true,
          slug: true,
          specialty: { select: { name: true } },
          profilePhoto: true,
          hospitalName: true,
          chamberAddress: true,
        },
      },
      slot: {
        include: {
          facility: {
            select: {
              id: true,
              name: true,
              address: true,
            },
          },
        },
      },
    },
    orderBy: { slot: { slotDate: "desc" } },
    take: 10,
  });

  // Check today's active appointment for live queue card
  const todayAppt = patientAppointments.find(
    (a) =>
      a.slot.slotDate.toISOString().split("T")[0] === todayUTC.toISOString().split("T")[0] &&
      a.status !== "CANCELLED" &&
      a.status !== "COMPLETED" &&
      a.status !== "NO_SHOW"
  );

  let todayQueueInfo = null;
  if (todayAppt) {
    todayQueueInfo = await getQueueInfo(todayAppt.id);
  }

  const upcomingAppts = patientAppointments.filter(
    (a) =>
      a.slot.slotDate >= todayUTC &&
      a.status !== "CANCELLED" &&
      a.status !== "COMPLETED" &&
      a.status !== "NO_SHOW"
  );

  const reviews = await prisma.review.findMany({
    where: { userId: currentUser.id },
    include: { doctor: { select: { slug: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Patient Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Welcome, {currentUser.name || "Patient"}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Track your appointment serials, live chamber queues, and medical reviews.
          </p>
        </div>
        <Link
          href="/dashboard/profile"
          className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-2xs self-start sm:self-auto"
        >
          <Settings className="h-3.5 w-3.5" />
          Account & Password Settings
        </Link>
      </div>

      {saved && (
        <div
          className="rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900"
          role="alert"
        >
          Changes saved successfully.
        </div>
      )}

      {/* TODAY'S LIVE QUEUE TRACKER (If patient has an appointment today) */}
      {todayAppt && (
        <section className="rounded-3xl border-2 border-indigo-300 bg-gradient-to-br from-indigo-500 to-indigo-700 text-white p-5 sm:p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-xs flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Live Today&apos;s Serial Pass
            </span>
            <span className="text-xs text-indigo-100 font-medium">
              {formatDhakaDate(todayAppt.slot.slotDate, { weekday: "long", day: "numeric", month: "short" })}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-extrabold">{todayAppt.doctor.fullName}</h2>
              <p className="text-xs text-indigo-100">
                {todayAppt.doctor.specialty?.name} • {todayAppt.slot.facility?.name || todayAppt.doctor.hospitalName || "Chamber"}
              </p>
              {(todayAppt.slot.facility?.address || todayAppt.doctor.chamberAddress) && (
                <p className="text-xs text-indigo-200 flex items-center gap-1 pt-0.5">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {todayAppt.slot.facility?.address || todayAppt.doctor.chamberAddress}
                </p>
              )}
            </div>

            <div className="rounded-2xl bg-white/10 backdrop-blur-md p-4 text-center border border-white/20 shrink-0">
              <p className="text-[10px] font-bold text-indigo-200 uppercase">YOUR SERIAL</p>
              <p className="text-3xl sm:text-4xl font-extrabold text-white">#{todayAppt.serialNumber}</p>
            </div>
          </div>

          {todayQueueInfo && (
            <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-3.5 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border border-white/10">
              <div>
                <p className="text-indigo-200 text-[11px]">Patients Ahead</p>
                <p className="text-base font-bold text-white">{todayQueueInfo.peopleAhead}</p>
              </div>
              {todayQueueInfo.estimatedTime && (
                <div>
                  <p className="text-indigo-200 text-[11px]">Est. Time</p>
                  <p className="text-base font-bold text-white">
                    {formatDhakaTime(todayQueueInfo.estimatedTime)}
                  </p>
                </div>
              )}
              <div className="col-span-2 sm:col-span-1 flex items-center sm:justify-end">
                <Link
                  href="/dashboard/appointments"
                  className="rounded-xl bg-white text-indigo-700 px-3.5 py-1.5 text-xs font-bold hover:bg-indigo-50 transition shadow-xs"
                >
                  View Live Pass →
                </Link>
              </div>
            </div>
          )}
        </section>
      )}

      {/* QUICK PATIENT ACTION TILES */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href="/dashboard/appointments"
          className="group rounded-3xl border border-indigo-200 bg-white p-5 hover:border-indigo-400 hover:shadow-xs transition space-y-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
              My Appointments ({patientAppointments.length})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Live queue position, upcoming visits, and history.
            </p>
          </div>
          <div className="text-xs font-bold text-indigo-600 flex items-center">
            View All <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </Link>

        <Link
          href="/search"
          className="group rounded-3xl border border-slate-200 bg-white p-5 hover:border-indigo-400 hover:shadow-xs transition space-y-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition">
              Find & Book Doctors
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Search by medical specialty, district, and chamber.
            </p>
          </div>
          <div className="text-xs font-bold text-indigo-600 flex items-center">
            Search Doctors <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </Link>

        <Link
          href="/facilities"
          className="group rounded-3xl border border-teal-200 bg-white p-5 hover:border-teal-400 hover:shadow-xs transition space-y-3"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 group-hover:bg-teal-700 group-hover:text-white transition">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 group-hover:text-teal-700 transition">
              Hospitals & Labs
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Find diagnostic tests, hospital emergency hotlines.
            </p>
          </div>
          <div className="text-xs font-bold text-teal-700 flex items-center">
            Browse Directory <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </div>
        </Link>
      </section>

      {/* UPCOMING APPOINTMENTS LIST */}
      {upcomingAppts.length > 0 && (
        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" /> Upcoming Doctor Visits ({upcomingAppts.length})
            </h2>
            <Link
              href="/dashboard/appointments"
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              View All →
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingAppts.slice(0, 3).map((appt) => (
              <div
                key={appt.id}
                className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <p className="font-bold text-sm text-slate-900">
                    {appt.doctor.fullName}
                  </p>
                  <p className="text-xs text-slate-500">
                    {appt.doctor.specialty?.name} • {appt.slot.facility?.name || appt.doctor.hospitalName || "Chamber"}
                  </p>
                  <p className="text-xs text-indigo-700 font-semibold flex items-center gap-1.5 pt-0.5">
                    <Clock className="h-3.5 w-3.5" />
                    {formatDhakaDate(appt.slot.slotDate, { weekday: "short", day: "numeric", month: "short" })} at {formatDhakaTime(appt.slot.startTime)}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="rounded-xl bg-white border border-slate-200 px-3 py-1.5 text-center">
                    <p className="text-[10px] text-slate-400 font-medium">SERIAL</p>
                    <p className="text-base font-extrabold text-slate-900">#{appt.serialNumber}</p>
                  </div>
                  <Link
                    href="/dashboard/appointments"
                    className="rounded-xl bg-indigo-600 text-white px-3.5 py-2 text-xs font-bold hover:bg-indigo-700 transition"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Claim Medical Profile Banners */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-900 font-bold text-sm">
            <Stethoscope className="h-4 w-4 text-indigo-600" />
            Are you a practicing Doctor?
          </div>
          <p className="text-xs text-indigo-950/80 leading-relaxed">
            Verify and claim your doctor listing to edit chamber timings, fees, and patient booking hotlines.
          </p>
          <Link
            href="/search"
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900"
          >
            Find & Claim Profile <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="rounded-3xl border border-teal-200 bg-teal-50/50 p-5 shadow-2xs space-y-3">
          <div className="flex items-center gap-2 text-teal-900 font-bold text-sm">
            <Building2 className="h-4 w-4 text-teal-700" />
            Hospital or Diagnostic Representative?
          </div>
          <p className="text-xs text-teal-950/80 leading-relaxed">
            Claim official management to publish diagnostic test prices, manage doctor schedules, and emergency contacts.
          </p>
          <Link
            href="/dashboard/claim-facility"
            className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-950"
          >
            Claim Medical Institute <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* User Reviews */}
      {reviews.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-7 shadow-sm">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-4">Your Doctor Reviews ({reviews.length})</h2>
          <UserReviews
            reviews={reviews.map((r) => ({
              id: r.id,
              rating: r.rating,
              comment: r.comment ?? "",
              isApproved: r.isApproved,
              doctorSlug: r.doctor.slug,
              doctorName: r.doctor.fullName,
            }))}
          />
        </div>
      )}
    </main>
  );
}
