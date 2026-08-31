"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Stethoscope,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Hourglass,
  Users,
  ArrowRight,
  Ban,
  Building2,
  MapPin,
} from "lucide-react";
import { cancelAppointmentAction } from "@/lib/actions/queue";

interface Appointment {
  id: number;
  serialNumber: number;
  status: string;
  bookingSource: string;
  patientName: string;
  patientPhone: string;
  chiefComplaint: string | null;
  estimatedTime: string | null;
  createdAt: string;
  doctor: {
    fullName: string;
    slug: string;
    specialty: { name: string } | null;
    profilePhoto: string | null;
    hospitalName?: string | null;
    chamberAddress?: string | null;
    city?: string | null;
    area?: string | null;
    appointmentPhone?: string | null;
  };
  slot: {
    id: number;
    slotDate: string;
    startTime: string;
    endTime: string;
    serialNumber: number;
    facility?: {
      id: number;
      name: string;
      type: string;
      address?: string | null;
      phone?: string | null;
      upazila?: {
        name: string;
        district?: { name: string } | null;
      } | null;
    } | null;
  };
  queueInfo: {
    position: number;
    totalActive: number;
    peopleAhead: number;
    estimatedTime: string | null;
    status: string;
    serialNumber: number;
  } | null;
}

export default function PatientAppointmentsView({
  initialAppointments,
}: {
  initialAppointments: Appointment[];
}) {
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [now, setNow] = useState(new Date());

  // Auto-refresh every 30 seconds for live queue position
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = appointments.filter((a) => {
    const slotDate = new Date(a.slot.slotDate);
    return (
      slotDate >= today &&
      a.status !== "CANCELLED" &&
      a.status !== "COMPLETED" &&
      a.status !== "NO_SHOW"
    );
  });

  const past = appointments.filter((a) => {
    const slotDate = new Date(a.slot.slotDate);
    return (
      slotDate < today ||
      a.status === "COMPLETED" ||
      a.status === "CANCELLED" ||
      a.status === "NO_SHOW"
    );
  });

  const displayed = activeTab === "upcoming" ? upcoming : past;

  function handleCancel(appointmentId: number, patientName: string) {
    const reason = prompt(`Cancel appointment for ${patientName}? Reason (optional):`) || "";
    if (reason === null) return;

    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId, reason);
      if (result.ok) {
        setMessage({ type: "success", text: "Appointment cancelled" });
        setAppointments((prev) =>
          prev.map((a) =>
            a.id === appointmentId
              ? { ...a, status: "CANCELLED" }
              : a
          )
        );
        setTimeout(() => setMessage(null), 4000);
      } else {
        setMessage({ type: "error", text: result?.message || "Failed to cancel" });
      }
    });
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  function isToday(dateStr: string): boolean {
    const d = new Date(dateStr);
    return d.toDateString() === new Date().toDateString();
  }

  function getStatusBadge(status: string) {
    const map: Record<string, { label: string; class: string; icon: any }> = {
      SCHEDULED: { label: "Scheduled", class: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
      CONFIRMED: { label: "Confirmed", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
      IN_PROGRESS: { label: "In Progress", class: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: Stethoscope },
      COMPLETED: { label: "Completed", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
      CANCELLED: { label: "Cancelled", class: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
      NO_SHOW: { label: "No Show", class: "bg-rose-50 text-rose-700 border-rose-200", icon: Ban },
    };
    return map[status] || { label: status, class: "bg-slate-100 text-slate-600 border-slate-200", icon: Clock };
  }

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">My Appointments</h1>
        <p className="text-sm text-slate-600 mt-1">
          View your bookings, see live queue position, and manage cancellations.
        </p>
      </header>

      {message && (
        <div
          className={`rounded-2xl border p-3.5 text-sm flex items-start gap-2 ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
              : "border-rose-200 bg-rose-50/80 text-rose-900"
          }`}
          role="alert"
        >
          {message.type === "success" ? (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2.5 text-sm font-bold transition border-b-2 ${
            activeTab === "upcoming"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Upcoming ({upcoming.length})
        </button>
        <button
          onClick={() => setActiveTab("past")}
          className={`px-4 py-2.5 text-sm font-bold transition border-b-2 ${
            activeTab === "past"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          History ({past.length})
        </button>
      </div>

      {/* Appointments list */}
      {displayed.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">
            {activeTab === "upcoming" ? "No upcoming appointments" : "No past appointments"}
          </p>
          {activeTab === "upcoming" && (
            <>
              <p className="text-xs text-slate-500 mt-1 mb-3">
                Book a serial with your favorite doctor.
              </p>
              <Link
                href="/search"
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition"
              >
                Find Doctors
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((appt) => {
            const badge = getStatusBadge(appt.status);
            const BadgeIcon = badge.icon;
            const isLive = isToday(appt.slot.slotDate) && (appt.status === "SCHEDULED" || appt.status === "CONFIRMED" || appt.status === "IN_PROGRESS");

            return (
              <div
                key={appt.id}
                className={`rounded-2xl border bg-white p-4 sm:p-5 space-y-3 ${
                  isLive ? "border-indigo-200 ring-1 ring-indigo-100" : "border-slate-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Serial number */}
                    <div className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-extrabold ${
                      appt.status === "COMPLETED"
                        ? "bg-emerald-50 text-emerald-700"
                        : appt.status === "CANCELLED" || appt.status === "NO_SHOW"
                        ? "bg-slate-100 text-slate-500"
                        : isToday(appt.slot.slotDate)
                        ? "bg-indigo-600 text-white"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      <span className="text-[9px] font-medium opacity-75">SERIAL</span>
                      <span className="text-xl sm:text-2xl leading-none">#{appt.serialNumber}</span>
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/doctor/${appt.doctor.slug}`}
                          className="text-sm font-bold text-slate-900 hover:text-indigo-600 transition"
                        >
                          {appt.doctor.fullName}
                        </Link>
                        {appt.doctor.specialty && (
                          <span className="text-[11px] text-slate-500">• {appt.doctor.specialty.name}</span>
                        )}
                        <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.class}`}>
                          <BadgeIcon className="h-3 w-3" />
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(appt.slot.slotDate)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <Clock className="h-3 w-3" />
                          {formatTime(appt.slot.startTime)}
                        </span>
                        {isToday(appt.slot.slotDate) && (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 uppercase">
                            Today
                          </span>
                        )}
                      </p>

                      {/* Chamber / Location Details */}
                      {(appt.slot.facility || appt.doctor.hospitalName || appt.doctor.chamberAddress) && (
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                          {(appt.slot.facility?.name || appt.doctor.hospitalName) && (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Building2 className="h-3 w-3 text-indigo-600 shrink-0" />
                              {appt.slot.facility?.name || appt.doctor.hospitalName}
                            </span>
                          )}
                          {(appt.slot.facility?.address || appt.doctor.chamberAddress) && (
                            <span className="inline-flex items-center gap-1 text-slate-600">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                              {appt.slot.facility?.address || appt.doctor.chamberAddress}
                              {appt.doctor.city && !appt.slot.facility?.address && `, ${appt.doctor.city}`}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Live queue info */}
                {isLive && appt.queueInfo && (
                  <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 flex items-center gap-1">
                      <Hourglass className="h-3 w-3" /> Live Queue Status
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <p className="text-slate-500">Position</p>
                        <p className="text-base font-extrabold text-indigo-900">
                          #{appt.queueInfo.serialNumber}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">People ahead</p>
                        <p className="text-base font-extrabold text-indigo-900 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {appt.queueInfo.peopleAhead}
                        </p>
                      </div>
                      {appt.queueInfo.estimatedTime && (
                        <div>
                          <p className="text-slate-500">Est. time</p>
                          <p className="text-base font-extrabold text-indigo-900">
                            {formatTime(appt.queueInfo.estimatedTime)}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            (~{appt.queueInfo.peopleAhead * 10} min wait)
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1 pt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Auto-updates every 30 seconds
                    </p>
                  </div>
                )}

                {/* Action buttons */}
                {(appt.status === "SCHEDULED" || appt.status === "CONFIRMED") && (
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/doctor/${appt.doctor.slug}`}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                    >
                      View Doctor →
                    </Link>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={() => handleCancel(appt.id, appt.patientName)}
                      disabled={isPending}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline disabled:opacity-60"
                    >
                      Cancel appointment
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state CTA */}
      {activeTab === "upcoming" && upcoming.length === 0 && (
        <div className="rounded-3xl border border-indigo-100 bg-indigo-50/30 p-6 text-center">
          <p className="text-sm font-semibold text-slate-900 mb-2">Ready to book your next visit?</p>
          <p className="text-xs text-slate-600 mb-4">Find a doctor and book a serial online</p>
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
          >
            <Stethoscope className="h-4 w-4" />
            Find Doctors
          </Link>
        </div>
      )}
    </main>
  );
}
