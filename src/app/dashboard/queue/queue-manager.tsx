"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Play,
  CheckCircle2,
  XCircle,
  Phone,
  User,
  Calendar,
  Clock,
  AlertCircle,
  TrendingUp,
  Users,
  CheckCheck,
  UserPlus,
  SkipForward,
  CalendarDays,
} from "lucide-react";
import {
  startNextPatientAction,
  cancelAppointmentAction,
  markNoShowAction,
  bookOfflineAppointmentAction,
  getQueueForDateAction,
} from "@/lib/actions/queue";
import { formatDhakaDate, formatDhakaTime, getDhakaDateString, isTodayDhaka } from "@/lib/timezone";

interface SlotData {
  id: number;
  serialNumber: number;
  startTime: string;
  endTime: string;
  status: string;
  appointment: {
    id: number;
    status: string;
    patientName: string;
    patientPhone: string;
    patientId: number;
    serialNumber: number;
    bookingSource: string;
    chiefComplaint: string | null;
    estimatedTime: string | null;
    actualStartTime: string | null;
  } | null;
}

interface QueueManagerProps {
  doctorId: number;
  todayDate: string;
  availableDates: string[];
  initialTodaySlots: SlotData[];
}

function getStatusBadge(status: string) {
  const map: Record<string, { label: string; class: string; icon: any }> = {
    AVAILABLE: { label: "Available", class: "bg-slate-100 text-slate-600 border-slate-200", icon: null },
    BOOKED: { label: "Booked", class: "bg-blue-50 text-blue-700 border-blue-200", icon: null },
    BLOCKED: { label: "Blocked", class: "bg-slate-100 text-slate-500 border-slate-200", icon: null },
    COMPLETED: { label: "Completed", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCheck },
    NO_SHOW: { label: "No Show", class: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
    SCHEDULED: { label: "Scheduled", class: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock },
    CONFIRMED: { label: "Confirmed", class: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
    IN_PROGRESS: { label: "In Progress", class: "bg-indigo-100 text-indigo-800 border-indigo-300", icon: Play },
    CANCELLED: { label: "Cancelled", class: "bg-slate-100 text-slate-500 border-slate-200", icon: XCircle },
  };
  return map[status] || { label: status, class: "bg-slate-100 text-slate-600 border-slate-200", icon: null };
}

export default function QueueManager({
  doctorId,
  todayDate,
  availableDates,
  initialTodaySlots,
}: QueueManagerProps) {
  const [activeTab, setActiveTab] = useState<"today" | "upcoming">("today");
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [todaySlots, setTodaySlots] = useState<SlotData[]>(initialTodaySlots);
  const [upcomingSlots, setUpcomingSlots] = useState<SlotData[]>([]);
  const [loadingDate, setLoadingDate] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showWalkIn, setShowWalkIn] = useState(false);
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInSlotId, setWalkInSlotId] = useState<string>("");

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  }

  // Load slots for a specific date
  function loadDateSlots(date: string) {
    setLoadingDate(date);
    setSelectedDate(date);
    startTransition(async () => {
      const result = await getQueueForDateAction(date);
      if (result) {
        const formatted = result.slots.map((s) => ({
          id: s.id,
          serialNumber: s.serialNumber,
          startTime: s.startTime.toISOString(),
          endTime: s.endTime.toISOString(),
          status: s.status,
          appointment: s.appointment
            ? {
                id: s.appointment.id,
                status: s.appointment.status,
                patientName: s.appointment.patientName,
                patientPhone: s.appointment.patientPhone,
                patientId: s.appointment.patientId,
                serialNumber: s.appointment.serialNumber,
                bookingSource: s.appointment.bookingSource,
                chiefComplaint: s.appointment.chiefComplaint,
                estimatedTime: s.appointment.estimatedTime?.toISOString() || null,
                actualStartTime: s.appointment.actualStartTime?.toISOString() || null,
              }
            : null,
        }));
        if (date === todayDate) {
          setTodaySlots(formatted);
        } else {
          setUpcomingSlots(formatted);
        }
      }
      setLoadingDate(null);
    });
  }

  // Auto-load selected date when tab changes
  useEffect(() => {
    if (activeTab === "upcoming" && selectedDate === todayDate && upcomingSlots.length === 0) {
      // Find first future date
      const futureDates = availableDates.filter((d) => d > todayDate);
      if (futureDates.length > 0) {
        // Use a microtask to avoid setState in effect
        queueMicrotask(() => loadDateSlots(futureDates[0]));
      }
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleCallNext() {
    startTransition(async () => {
      const result = await startNextPatientAction();
      if (result?.ok) {
        showMessage("success", result.message || "Success");
        setTimeout(() => window.location.reload(), 500);
      } else {
        showMessage("error", result?.message || "Failed to call next patient");
      }
    });
  }

  function handleCancel(appointmentId: number, patientName: string) {
    const reason = prompt(`Cancel appointment for ${patientName}?\n\nReason (optional):`) || "";
    if (reason === null) return;

    startTransition(async () => {
      const result = await cancelAppointmentAction(appointmentId, reason);
      if (result?.ok) {
        showMessage("success", result.message || "Cancelled");
        // Update local state
        setTodaySlots((prev) =>
          prev.map((s) =>
            s.appointment?.id === appointmentId
              ? { ...s, status: "AVAILABLE", appointment: null }
              : s
          )
        );
        setUpcomingSlots((prev) =>
          prev.map((s) =>
            s.appointment?.id === appointmentId
              ? { ...s, status: "AVAILABLE", appointment: null }
              : s
          )
        );
      } else {
        showMessage("error", result?.message || "Failed to cancel");
      }
    });
  }

  function handleNoShow(appointmentId: number) {
    if (!confirm("Mark this patient as no-show? Their slot will be freed.")) return;

    startTransition(async () => {
      const result = await markNoShowAction(appointmentId);
      if (result?.ok) {
        showMessage("success", result.message || "Marked");
        setTodaySlots((prev) =>
          prev.map((s) =>
            s.appointment?.id === appointmentId
              ? { ...s, status: "AVAILABLE", appointment: s.appointment ? { ...s.appointment, status: "NO_SHOW" } : null }
              : s
          )
        );
        setUpcomingSlots((prev) =>
          prev.map((s) =>
            s.appointment?.id === appointmentId
              ? { ...s, status: "AVAILABLE", appointment: s.appointment ? { ...s.appointment, status: "NO_SHOW" } : null }
              : s
          )
        );
      } else {
        showMessage("error", result?.message || "Failed to mark as no-show");
      }
    });
  }

  function handleWalkIn(e: React.FormEvent) {
    e.preventDefault();
    if (!walkInSlotId || !walkInName || !walkInPhone) return;

    startTransition(async () => {
      const result = await bookOfflineAppointmentAction({
        slotId: Number(walkInSlotId),
        patientName: walkInName,
        patientPhone: walkInPhone,
      });
      if (result?.ok) {
        showMessage("success", result.message || "Booked");
        setShowWalkIn(false);
        setWalkInName("");
        setWalkInPhone("");
        setWalkInSlotId("");
        setTimeout(() => window.location.reload(), 500);
      } else {
        showMessage("error", result?.message || "Failed to book walk-in");
      }
    });
  }

  const slotsToShow = activeTab === "today" ? todaySlots : upcomingSlots;
  const availableForWalkIn = slotsToShow.filter((s) => s.status === "AVAILABLE");

  // Compute stats
  const totalSlots = slotsToShow.length;
  const bookedCount = slotsToShow.filter((s) => s.appointment && s.appointment.status !== "CANCELLED" && s.appointment.status !== "NO_SHOW").length;
  const completedCount = slotsToShow.filter((s) => s.appointment?.status === "COMPLETED").length;
  const inProgress = slotsToShow.find((s) => s.appointment?.status === "IN_PROGRESS");
  const nextUp = slotsToShow.find((s) => s.appointment && (s.appointment.status === "SCHEDULED" || s.appointment.status === "CONFIRMED"));

  const currentSelectedLabel = activeTab === "today"
    ? "Today"
    : formatDhakaDate(selectedDate, { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      {/* Status message */}
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
      <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
        <button
          onClick={() => {
            setActiveTab("today");
            setSelectedDate(todayDate);
          }}
          className={`px-4 py-2.5 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "today"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab("upcoming")}
          className={`px-4 py-2.5 text-sm font-bold transition border-b-2 whitespace-nowrap ${
            activeTab === "upcoming"
              ? "border-indigo-600 text-indigo-700"
              : "border-transparent text-slate-500 hover:text-slate-700"
          }`}
        >
          Upcoming ({availableDates.filter((d) => d > todayDate).length})
        </button>
      </div>

      {/* Date picker for upcoming */}
      {activeTab === "upcoming" && availableDates.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="h-4 w-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">Select a date</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {availableDates.map((date) => {
              const isSelected = selectedDate === date;
              const isToday = isTodayDhaka(date);
              return (
                <button
                  key={date}
                  onClick={() => loadDateSlots(date)}
                  disabled={loadingDate === date}
                  className={`shrink-0 rounded-2xl border p-3 text-center transition min-w-[80px] ${
                    isSelected
                      ? "border-indigo-600 bg-indigo-50 ring-2 ring-indigo-200"
                      : isToday
                      ? "border-emerald-300 bg-emerald-50/30"
                      : "border-slate-200 bg-white hover:border-indigo-300"
                  }`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                  </p>
                  <p className="text-base font-bold text-slate-900 mt-0.5">
                    {new Date(date).getDate()}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                  </p>
                  {isToday && (
                    <span className="inline-block mt-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-700">
                      TODAY
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Current date header */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          {currentSelectedLabel}
        </h2>
        {activeTab === "today" && (
          <div className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2.5 py-1 rounded-full">
            Auto-refreshes page
          </div>
        )}
      </div>

      {/* Stats cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <Calendar className="h-3.5 w-3.5" /> Total Slots
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{totalSlots}</p>
        </div>
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Users className="h-3.5 w-3.5" /> Booked
          </div>
          <p className="text-2xl font-extrabold text-blue-900 mt-1">{bookedCount}</p>
        </div>
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700">
            <CheckCheck className="h-3.5 w-3.5" /> Completed
          </div>
          <p className="text-2xl font-extrabold text-emerald-900 mt-1">{completedCount}</p>
        </div>
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-indigo-700">
            <TrendingUp className="h-3.5 w-3.5" /> Progress
          </div>
          <p className="text-2xl font-extrabold text-indigo-900 mt-1">
            {bookedCount > 0 ? Math.round((completedCount / bookedCount) * 100) : 0}%
          </p>
        </div>
      </section>

      {/* Action bar */}
      <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          {activeTab === "today" ? (
            inProgress ? (
              <p className="text-sm">
                <span className="text-slate-500">Currently seeing:</span>{" "}
                <span className="font-bold text-indigo-700 text-base">Serial #{inProgress.serialNumber}</span>
              </p>
            ) : nextUp ? (
              <p className="text-sm">
                <span className="text-slate-500">Next up:</span>{" "}
                <span className="font-bold text-amber-700 text-base">Serial #{nextUp.serialNumber}</span>
              </p>
            ) : bookedCount - completedCount > 0 ? (
              <p className="text-sm text-slate-600">All patients done for today 🎉</p>
            ) : (
              <p className="text-sm text-slate-500">No patients scheduled</p>
            )
          ) : (
            <p className="text-sm text-slate-500">
              {bookedCount} patient{bookedCount !== 1 ? "s" : ""} booked for this day
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {activeTab === "today" && bookedCount - completedCount > 0 && (
            <button
              onClick={handleCallNext}
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
            >
              <Play className="h-4 w-4" />
              {inProgress ? "Complete & Call Next" : "Call Next Patient"}
            </button>
          )}
          <button
            onClick={() => setShowWalkIn(!showWalkIn)}
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
          >
            <UserPlus className="h-4 w-4" />
            Add Walk-in
          </button>
        </div>
      </section>

      {/* Walk-in booking form */}
      {showWalkIn && (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/30 p-5 space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-indigo-600" /> Book Walk-in Patient
            </h2>
            <button onClick={() => setShowWalkIn(false)} className="text-xs font-semibold text-slate-500">
              Cancel
            </button>
          </header>

          {availableForWalkIn.length === 0 ? (
            <p className="text-sm text-slate-600">No available slots for this date.</p>
          ) : (
            <form onSubmit={handleWalkIn} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Available Slot
                  </label>
                  <select
                    value={walkInSlotId}
                    onChange={(e) => setWalkInSlotId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="">— Choose slot —</option>
                    {availableForWalkIn.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.serialNumber} - {formatDhakaTime(s.startTime)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    value={walkInName}
                    onChange={(e) => setWalkInName(e.target.value)}
                    required
                    placeholder="Full name"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={walkInPhone}
                    onChange={(e) => setWalkInPhone(e.target.value)}
                    required
                    placeholder="01700000000"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isPending || !walkInSlotId || !walkInName || !walkInPhone}
                className="inline-flex items-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
              >
                {isPending ? "Booking..." : "Book Walk-in Serial"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* Queue list */}
      {loadingDate ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-indigo-600 border-t-transparent rounded-full" />
        </div>
      ) : slotsToShow.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-700">No slots scheduled for this date</p>
          {activeTab === "upcoming" && (
            <p className="text-xs text-slate-500 mt-1">
              Try selecting another date above.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {slotsToShow.map((slot) => {
            const badge = getStatusBadge(slot.appointment?.status || slot.status);
            const StatusIcon = badge.icon;
            const isInProgress = slot.appointment?.status === "IN_PROGRESS";

            return (
              <div
                key={slot.id}
                className={`rounded-2xl border p-3 sm:p-4 transition ${
                  isInProgress
                    ? "border-indigo-400 bg-indigo-50 shadow-sm ring-1 ring-indigo-200"
                    : slot.appointment && (slot.appointment.status === "SCHEDULED" || slot.appointment.status === "CONFIRMED") && activeTab === "today"
                    ? "border-amber-300 bg-amber-50/50"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 flex-col sm:flex-row">
                  {/* Serial number */}
                  <div className={`shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex flex-col items-center justify-center font-extrabold ${
                    isInProgress
                      ? "bg-indigo-600 text-white"
                      : slot.appointment && (slot.appointment.status === "SCHEDULED" || slot.appointment.status === "CONFIRMED") && activeTab === "today"
                      ? "bg-amber-100 text-amber-800"
                      : slot.appointment
                      ? "bg-slate-100 text-slate-700"
                      : "bg-slate-50 text-slate-400 border border-dashed border-slate-200"
                  }`}>
                    <span className="text-[10px] font-medium opacity-75">SERIAL</span>
                    <span className="text-xl sm:text-2xl leading-none">#{slot.serialNumber}</span>
                  </div>

                  {/* Slot details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-bold text-slate-900 flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {formatDhakaTime(slot.startTime)} – {formatDhakaTime(slot.endTime)}
                      </span>
                      <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${badge.class}`}>
                        {StatusIcon && <StatusIcon className="h-3 w-3" />}
                        {badge.label}
                      </span>
                    </div>

                    {slot.appointment ? (
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{slot.appointment.patientName}</span>
                          <a
                            href={`tel:${slot.appointment.patientPhone}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {slot.appointment.patientPhone}
                          </a>
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                          <span className="rounded bg-slate-100 px-1.5 py-0.5">
                            {slot.appointment.bookingSource === "ONLINE" ? "🌐 Online" : slot.appointment.bookingSource === "WALK_IN" ? "🚶 Walk-in" : slot.appointment.bookingSource === "PHONE" ? "📞 Phone" : slot.appointment.bookingSource}
                          </span>
                          {slot.appointment.estimatedTime && activeTab === "today" && (
                            <span>⏱ Est. {formatDhakaTime(slot.appointment.estimatedTime)}</span>
                          )}
                        </div>
                      </div>
                    ) : slot.status === "AVAILABLE" ? (
                      <p className="text-sm text-slate-400 italic">Available for booking</p>
                    ) : slot.status === "BLOCKED" ? (
                      <p className="text-sm text-slate-500 italic">Slot blocked (chamber off)</p>
                    ) : null}
                  </div>

                  {/* Actions */}
                  {slot.appointment && slot.appointment.status !== "COMPLETED" && slot.appointment.status !== "CANCELLED" && slot.appointment.status !== "NO_SHOW" && (
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      {activeTab === "today" && !isInProgress && (
                        <button
                          onClick={() => handleNoShow(slot.appointment!.id)}
                          disabled={isPending}
                          className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition"
                          title="Mark no-show"
                          aria-label="No show"
                        >
                          <SkipForward className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleCancel(slot.appointment!.id, slot.appointment!.patientName)}
                        disabled={isPending}
                        className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                        title="Cancel appointment"
                        aria-label="Cancel"
                      >
                        <XCircle className="h-4 w-4" />
          </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
