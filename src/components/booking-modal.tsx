"use client";

import { useState, useTransition, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowRight,
  Loader2,
  MessageSquare,
  MapPin,
  Building2,
} from "lucide-react";
import {
  getAvailableDatesAction,
  getAvailableSlotsAction,
  bookAppointmentAction,
} from "@/lib/actions/queue";
import { formatDhakaDate, formatDhakaTime } from "@/lib/timezone";

interface BookingModalProps {
  doctorId: number;
  doctorName: string;
  specialty: string | null;
  consultationFee: number | null;
  userLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  hospitalName?: string;
  chamberAddress?: string;
  city?: string;
  area?: string;
  appointmentPhone?: string;
}

interface AvailableSlotItem {
  id: number;
  serialNumber: number;
  startTime: string;
  endTime: string;
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
  schedule?: {
    id: number;
    startTime: string;
    endTime: string;
    notes?: string | null;
    slotDuration?: number;
  } | null;
  doctor?: {
    hospitalName?: string | null;
    chamberAddress?: string | null;
    city?: string | null;
    area?: string | null;
    appointmentPhone?: string | null;
  } | null;
}

interface ChamberSlotGroup {
  id: string;
  facilityId: number | null;
  scheduleId: number | null;
  chamberName: string;
  chamberType?: string;
  address: string;
  timeRange: string;
  shiftLabel: string;
  notes?: string | null;
  slots: AvailableSlotItem[];
}

export default function BookingModal({
  doctorId,
  doctorName,
  specialty,
  consultationFee,
  userLoggedIn,
  userName,
  userEmail,
  userPhone,
  hospitalName,
  chamberAddress,
  city,
  area,
  appointmentPhone,
}: BookingModalProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();

  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // -----------------------------
  // Form state
  // -----------------------------
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [selectedChamberFilter, setSelectedChamberFilter] = useState("all");

  const [patientName, setPatientName] = useState(userName || "");
  const [patientPhone, setPatientPhone] = useState(userPhone || "");
  const [patientEmail, setPatientEmail] = useState(userEmail || "");
  const [chiefComplaint, setChiefComplaint] = useState("");

  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // -----------------------------
  // Load dates
  // -----------------------------
  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) setLoadingDates(true);
    });

    getAvailableDatesAction(doctorId)
      .then((dates) => {
        if (!cancelled) {
          setAvailableDates(dates);
          setLoadingDates(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingDates(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen, doctorId]);

  // -----------------------------
  // Load slots
  // -----------------------------
  useEffect(() => {
    if (!selectedDate) return;

    let cancelled = false;

    queueMicrotask(() => {
      if (!cancelled) {
        setLoadingSlots(true);
        setSelectedChamberFilter("all");
      }
    });

    getAvailableSlotsAction(doctorId, selectedDate)
      .then((slots) => {
        if (!cancelled) {
          setAvailableSlots(
            slots.map((s: any) => ({
              id: s.id,
              serialNumber: s.serialNumber,
              startTime:
                typeof s.startTime === "string"
                  ? s.startTime
                  : s.startTime.toISOString(),
              endTime:
                typeof s.endTime === "string"
                  ? s.endTime
                  : s.endTime.toISOString(),
              facility: s.facility || null,
              schedule: s.schedule || null,
              doctor: s.doctor || null,
            }))
          );

          setLoadingSlots(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoadingSlots(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedDate, doctorId]);

  // -----------------------------
  // Reset
  // -----------------------------
  function reset() {
    setStep(1);
    setSelectedDate("");
    setSelectedSlotId(null);
    setSelectedChamberFilter("all");
    setAvailableSlots([]);

    setPatientName(userName || "");
    setPatientPhone(userPhone || "");
    setPatientEmail(userEmail || "");
    setChiefComplaint("");

    setMessage(null);
  }

  // -----------------------------
  // Open
  // -----------------------------
  function handleOpen() {
    if (!userLoggedIn) {
      router.push(
        `/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }

    setIsOpen(true);
  }

  // -----------------------------
  // Close
  // -----------------------------
  function handleClose() {
    setIsOpen(false);

    window.setTimeout(() => {
      reset();
    }, 250);
  }

  // -----------------------------
  // Booking
  // -----------------------------
  function handleBook(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedSlotId) return;

    setMessage(null);

    startTransition(async () => {
      const result = await bookAppointmentAction({
        slotId: selectedSlotId,
        patientName: patientName.trim(),
        patientPhone: patientPhone.trim(),
        patientEmail: patientEmail.trim() || undefined,
        chiefComplaint: chiefComplaint.trim() || undefined,
      });

      if (result.ok) {
        setStep(4);
        setMessage({
          type: "success",
          text: result.message,
        });
      } else {
        setMessage({
          type: "error",
          text: result.message,
        });
      }
    });
  }

  const selectedSlot = availableSlots.find(
    (slot) => slot.id === selectedSlotId
  );

  // -----------------------------
  // Chamber name
  // -----------------------------
  function getSlotChamberName(slot?: AvailableSlotItem): string {
    if (slot?.facility?.name) return slot.facility.name;
    if (slot?.doctor?.hospitalName) return slot.doctor.hospitalName;
    if (hospitalName) return hospitalName;

    return "Doctor's Chamber";
  }

  // -----------------------------
  // Chamber address
  // -----------------------------
  function getSlotChamberAddress(slot?: AvailableSlotItem): string {
    if (slot?.facility?.address) {
      const parts = [
        slot.facility.address,
        slot.facility.upazila?.name,
        slot.facility.upazila?.district?.name,
      ].filter(Boolean);

      return parts.join(", ");
    }

    if (slot?.doctor?.chamberAddress) {
      const parts = [
        slot.doctor.chamberAddress,
        slot.doctor.area,
        slot.doctor.city,
      ].filter(Boolean);

      return parts.join(", ");
    }

    if (chamberAddress) {
      return [chamberAddress, area, city].filter(Boolean).join(", ");
    }

    if (city || area) {
      return [area, city].filter(Boolean).join(", ");
    }

    return "Chamber address available on appointment confirmation";
  }

  // -----------------------------
  // Group slots
  // -----------------------------
  const chamberGroups: ChamberSlotGroup[] = [];
  const groupsMap = new Map<string, ChamberSlotGroup>();

  for (const slot of availableSlots) {
    const facilityId = slot.facility?.id ?? null;
    const scheduleId = slot.schedule?.id ?? null;

    const key = facilityId
      ? `fac-${facilityId}_sch-${scheduleId || "none"}`
      : `doc-chamber_sch-${scheduleId || "none"}`;

    if (!groupsMap.has(key)) {
      const chamberName = getSlotChamberName(slot);
      const address = getSlotChamberAddress(slot);
      const notes = slot.schedule?.notes || null;

      const startTimeStr =
        slot.schedule?.startTime || formatDhakaTime(slot.startTime);

      const endTimeStr =
        slot.schedule?.endTime || formatDhakaTime(slot.endTime);

      const timeRange = `${startTimeStr} – ${endTimeStr}`;

      let shiftLabel = "Chamber Session";

      const startH = new Date(slot.startTime).getUTCHours();
      const dhakaHour = (startH + 6) % 24;

      if (dhakaHour < 12) {
        shiftLabel = "Morning Session";
      } else if (dhakaHour < 16) {
        shiftLabel = "Afternoon Session";
      } else if (dhakaHour < 20) {
        shiftLabel = "Evening Session";
      } else {
        shiftLabel = "Night Session";
      }

      const newGroup: ChamberSlotGroup = {
        id: key,
        facilityId,
        scheduleId,
        chamberName,
        chamberType: slot.facility?.type,
        address,
        timeRange,
        shiftLabel,
        notes,
        slots: [],
      };

      groupsMap.set(key, newGroup);
      chamberGroups.push(newGroup);
    }

    groupsMap.get(key)!.slots.push(slot);
  }

  const visibleChamberGroups =
    selectedChamberFilter === "all"
      ? chamberGroups
      : chamberGroups.filter(
          (group) => group.id === selectedChamberFilter
        );

  return (
    <>
      {/* =========================================
          OPEN BUTTON
      ========================================= */}
      <button
        onClick={handleOpen}
        className="
          inline-flex w-full sm:w-auto
          min-h-11
          items-center justify-center gap-2
          rounded-2xl
          bg-indigo-600
          px-5 py-3
          text-sm font-bold text-white
          shadow-sm
          transition
          hover:bg-indigo-700
          active:scale-[0.98]
          cursor-pointer
        "
      >
        <Calendar className="h-4 w-4 shrink-0" />
        Book Serial Online
      </button>

      {/* =========================================
          MODAL
      ========================================= */}
      {isOpen && (
        <div
          className="
            fixed inset-0 z-50
            flex items-end sm:items-center justify-center
            bg-slate-900/60
            backdrop-blur-sm
            p-0 sm:p-4
          "
          onClick={handleClose}
        >
          {/* =====================================
              MODAL CONTAINER
          ===================================== */}
          <div
            className="
              relative
              flex flex-col
              w-full
              sm:max-w-xl
              lg:max-w-2xl
              max-h-[95dvh] sm:max-h-[90dvh]
              overflow-hidden
              bg-white
              rounded-t-[1.75rem]
              sm:rounded-3xl
              shadow-2xl
              animate-in fade-in slide-in-from-bottom-3 sm:slide-in-from-bottom-0
              duration-200
              pb-[env(safe-area-inset-bottom)]
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* ===================================
                HEADER
            =================================== */}
            <div
              className="
                shrink-0
                sticky top-0 z-20
                border-b border-slate-200
                bg-white
                px-4 sm:px-6
                pt-4 pb-3
                sm:py-4
              "
            >
              {/* Mobile drag indicator */}
              <div className="flex justify-center sm:hidden mb-3">
                <div className="h-1 w-10 rounded-full bg-slate-300" />
              </div>

              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Book Serial
                  </h2>

                  <p className="mt-0.5 text-xs sm:text-sm text-slate-600 leading-relaxed break-words">
                    {doctorName}
                    {specialty ? ` • ${specialty}` : ""}
                    {consultationFee ? ` • ৳${consultationFee}` : ""}
                  </p>
                </div>

                <button
                  onClick={handleClose}
                  className="
                    shrink-0
                    flex h-9 w-9
                    items-center justify-center
                    rounded-xl
                    text-slate-400
                    hover:bg-slate-100
                    hover:text-slate-700
                    active:bg-slate-200
                    transition
                    cursor-pointer
                  "
                  aria-label="Close booking modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Stepper */}
              <div className="mt-3 flex items-center gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`
                      h-1.5 flex-1 rounded-full transition-colors
                      ${
                        step >= s
                          ? "bg-indigo-600"
                          : "bg-slate-200"
                      }
                    `}
                  />
                ))}
              </div>
            </div>

            {/* ===================================
                SCROLLABLE CONTENT
            =================================== */}
            <div
              className="
                min-h-0
                flex-1
                overflow-y-auto
                overscroll-contain
                px-4 sm:px-6
                py-4 sm:py-6
                pb-6 sm:pb-8
              "
            >
              <div className="space-y-5">
                {/* =================================
                    MESSAGE
                ================================= */}
                {message && (
                  <div
                    className={`
                      flex items-start gap-2.5
                      rounded-2xl
                      border
                      p-3 sm:p-3.5
                      text-xs sm:text-sm
                      ${
                        message.type === "success"
                          ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                          : "border-rose-200 bg-rose-50/80 text-rose-900"
                      }
                    `}
                    role="alert"
                  >
                    {message.type === "success" ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                    ) : (
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    )}

                    <span className="min-w-0 break-words">
                      {message.text}
                    </span>
                  </div>
                )}

                {/* =================================
                    STEP 1
                ================================= */}
                {step === 1 && (
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Choose Date
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Select an available day to see chamber slots
                      </p>
                    </div>

                    {loadingDates ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      </div>
                    ) : availableDates.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8 text-center">
                        <Calendar className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                        <p className="text-sm font-semibold text-slate-700">
                          No available dates
                        </p>

                        <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
                          This doctor hasn&apos;t published any open
                          schedules yet. Please check back later or call
                          the chamber.
                        </p>

                        {appointmentPhone && (
                          <p className="mt-3 text-xs font-semibold text-indigo-700 break-words">
                            Chamber Hotline: {appointmentPhone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {availableDates.map((date) => (
                          <button
                            key={date}
                            onClick={() => {
                              setSelectedDate(date);
                              setStep(2);
                            }}
                            className={`
                              min-h-[82px]
                              rounded-2xl
                              border
                              p-2 sm:p-3
                              text-center
                              transition
                              active:scale-[0.97]
                              cursor-pointer
                              ${
                                selectedDate === date
                                  ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                                  : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                              }
                            `}
                          >
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                              {formatDhakaDate(
                                new Date(`${date}T00:00:00.000Z`),
                                { weekday: "short" }
                              )}
                            </p>

                            <p className="mt-0.5 text-base sm:text-lg font-bold text-slate-900">
                              {formatDhakaDate(
                                new Date(`${date}T00:00:00.000Z`),
                                { day: "numeric" }
                              )}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-500">
                              {formatDhakaDate(
                                new Date(`${date}T00:00:00.000Z`),
                                { month: "short" }
                              )}
                            </p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* =================================
                    STEP 2
                ================================= */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <button
                        onClick={() => setStep(1)}
                        className="mb-1.5 block text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                      >
                        ← Change date
                      </button>

                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed">
                        Choose Serial
                      </h3>

                      {selectedDate && (
                        <p className="mt-0.5 text-xs text-slate-500">
                          {formatDhakaDate(
                            new Date(`${selectedDate}T00:00:00.000Z`),
                            {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </p>
                      )}

                      <p className="mt-1 text-xs text-slate-500">
                        {chamberGroups.length > 1
                          ? `${chamberGroups.length} chambers/shifts available on this date`
                          : "Select an available serial for consultation"}
                      </p>
                    </div>

                    
                    {/* Chamber tabs - Vertical Layout */}
                    {chamberGroups.length > 1 && (
                      <div className="space-y-2">
                        {/* All Chambers */}
                        <button
                          onClick={() => setSelectedChamberFilter("all")}
                          className={`
                            w-full
                            min-h-10
                            flex items-center justify-between
                            gap-2
                            rounded-xl
                            px-3 py-2
                            text-xs font-bold
                            text-left
                            transition
                            cursor-pointer
                            ${
                              selectedChamberFilter === "all"
                                ? "bg-indigo-600 text-white shadow-sm"
                                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                            }
                          `}
                        >
                          <span>All Chambers</span>

                          <span className="shrink-0 opacity-80">
                            ({availableSlots.length})
                          </span>
                        </button>

                        {/* Individual Chambers */}
                        {chamberGroups.map((group) => (
                          <button
                            key={group.id}
                            onClick={() => setSelectedChamberFilter(group.id)}
                            className={`
                              w-full
                              min-h-10
                              flex items-center justify-between
                              gap-3
                              rounded-xl
                              px-3 py-2
                              text-xs font-bold
                              text-left
                              transition
                              cursor-pointer
                              ${
                                selectedChamberFilter === group.id
                                  ? "bg-indigo-600 text-white shadow-sm"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }
                            `}
                          >
                            <span className="flex min-w-0 items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 shrink-0" />

                              <span className="min-w-0 truncate">
                                {group.chamberName}
                              </span>
                            </span>

                            <span className="shrink-0 opacity-80">
                              ({group.slots.length})
                            </span>
                          </button>
                        ))}
                      </div>
                    )}


                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 sm:p-8 text-center">
                        <Clock className="mx-auto mb-2 h-8 w-8 text-slate-300" />

                        <p className="text-sm font-semibold text-slate-700">
                          No slots available on this date
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Please select another date from the calendar.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {visibleChamberGroups.map((group) => (
                          <div
                            key={group.id}
                            className="
                              rounded-2xl
                              border border-indigo-100
                              bg-gradient-to-b from-indigo-50/40 to-white
                              p-3.5 sm:p-4
                              shadow-sm
                            "
                          >
                            {/* Chamber header */}
                            <div className="space-y-2 border-b border-indigo-100 pb-3">
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div className="flex min-w-0 items-start gap-1.5">
                                  <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />

                                  <div className="min-w-0">
                                    <h4 className="text-xs sm:text-sm font-bold leading-snug text-slate-900 break-words">
                                      {group.chamberName}
                                    </h4>

                                    <p className="mt-0.5 text-[10px] font-medium text-indigo-600">
                                      {group.shiftLabel}
                                    </p>
                                  </div>
                                </div>

                                <span
                                  className="
                                    inline-flex
                                    w-fit
                                    max-w-full
                                    items-center gap-1
                                    rounded-lg
                                    bg-indigo-100
                                    px-2 py-1
                                    text-[10px] sm:text-[11px]
                                    font-bold text-indigo-800
                                  "
                                >
                                  <Clock className="h-3 w-3 shrink-0" />
                                  <span className="break-words">
                                    {group.timeRange}
                                  </span>
                                </span>
                              </div>

                              <p className="flex items-start gap-1 text-[11px] leading-relaxed text-slate-600">
                                <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />

                                <span className="min-w-0 break-words">
                                  {group.address}
                                </span>
                              </p>

                              {group.notes && (
                                <p className="inline-block max-w-full rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-medium leading-relaxed text-amber-800 break-words">
                                  Note: {group.notes}
                                </p>
                              )}
                            </div>

                            {/* Serials */}
                            <div className="pt-3">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                                  Available Serials
                                </span>

                                <span className="shrink-0 text-[10px] sm:text-[11px] font-semibold text-emerald-700">
                                  {group.slots.length} open
                                </span>
                              </div>

                              <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                                {group.slots.map((slot) => {
                                  const isSelected =
                                    selectedSlotId === slot.id;

                                  return (
                                    <button
                                      key={slot.id}
                                      onClick={() => {
                                        setSelectedSlotId(slot.id);
                                        setStep(3);
                                      }}
                                      className={`
                                        min-h-[64px]
                                        rounded-xl
                                        border
                                        px-2 py-2.5
                                        text-center
                                        transition
                                        active:scale-[0.97]
                                        cursor-pointer
                                        ${
                                          isSelected
                                            ? "border-indigo-600 bg-indigo-600 text-white shadow-sm"
                                            : "border-slate-200 bg-white hover:border-indigo-400 hover:bg-indigo-50/70"
                                        }
                                      `}
                                    >
                                      <p
                                        className={`
                                          text-xs sm:text-sm font-bold
                                          ${
                                            isSelected
                                              ? "text-white"
                                              : "text-slate-900"
                                          }
                                        `}
                                      >
                                        {formatDhakaTime(
                                          slot.startTime
                                        )}
                                      </p>

                                      <p
                                        className={`
                                          mt-0.5 text-[10px] sm:text-[11px] font-bold
                                          ${
                                            isSelected
                                              ? "text-indigo-100"
                                              : "text-indigo-600"
                                          }
                                        `}
                                      >
                                        Serial #{slot.serialNumber}
                                      </p>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* =================================
                    STEP 3
                ================================= */}
                {step === 3 && (
                  <form onSubmit={handleBook} className="space-y-4">
                    <div>
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="mb-2 block text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                      >
                        ← Change time
                      </button>

                      {/* Appointment summary */}
                      <div
                        className="
                          rounded-2xl
                          border border-indigo-200
                          bg-indigo-50/60
                          p-3.5 sm:p-4
                          space-y-3
                        "
                      >
                        <div className="flex items-start justify-between gap-3 border-b border-indigo-100 pb-3">
                          <div className="min-w-0">
                            <p className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                              Appointment Summary
                            </p>

                            <p className="mt-0.5 text-sm font-bold leading-snug text-slate-900 break-words">
                              {doctorName}
                              {specialty ? ` (${specialty})` : ""}
                            </p>
                          </div>

                          <span
                            className="
                              shrink-0
                              rounded-xl
                              bg-indigo-600
                              px-2.5 py-1
                              text-[10px] sm:text-xs
                              font-bold text-white
                              shadow-sm
                            "
                          >
                            #{selectedSlot?.serialNumber}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700">
                          <div className="flex items-start gap-1.5 min-w-0">
                            <Calendar className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />

                            <span className="break-words">
                              {selectedDate &&
                                formatDhakaDate(
                                  new Date(
                                    `${selectedDate}T00:00:00.000Z`
                                  ),
                                  {
                                    weekday: "short",
                                    day: "numeric",
                                    month: "short",
                                  }
                                )}
                            </span>
                          </div>

                          <div className="flex items-start gap-1.5 min-w-0">
                            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />

                            <span>
                              {selectedSlot &&
                                formatDhakaTime(
                                  selectedSlot.startTime
                                )}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1.5 border-t border-indigo-100 pt-3">
                          <p className="flex items-start gap-1.5 text-xs font-bold text-slate-900">
                            <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-indigo-600" />

                            <span className="min-w-0 break-words">
                              {getSlotChamberName(selectedSlot)}
                            </span>
                          </p>

                          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-600">
                            <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />

                            <span className="min-w-0 break-words">
                              {getSlotChamberAddress(selectedSlot)}
                            </span>
                          </p>
                        </div>

                        {consultationFee && (
                          <div className="flex items-center justify-between gap-3 border-t border-indigo-100 pt-2 text-[11px] font-semibold text-indigo-900">
                            <span>Consultation Fee</span>
                            <span className="shrink-0">
                              ৳{consultationFee}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Patient form */}
                    <div className="space-y-3.5">
                      {/* Name */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                          <User className="mr-1 inline h-3 w-3" />
                          Patient Full Name
                        </label>

                        <input
                          type="text"
                          value={patientName}
                          onChange={(e) =>
                            setPatientName(e.target.value)
                          }
                          required
                          autoComplete="name"
                          className="
                            min-h-11
                            w-full
                            rounded-2xl
                            border border-slate-300
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            outline-none
                            transition
                            focus:border-indigo-500
                            focus:ring-2
                            focus:ring-indigo-500/10
                          "
                        />
                      </div>

                      {/* Phone */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                          <Phone className="mr-1 inline h-3 w-3" />
                          Phone Number
                        </label>

                        <input
                          type="tel"
                          value={patientPhone}
                          onChange={(e) =>
                            setPatientPhone(e.target.value)
                          }
                          required
                          autoComplete="tel"
                          inputMode="tel"
                          placeholder="01700000000"
                          className="
                            min-h-11
                            w-full
                            rounded-2xl
                            border border-slate-300
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            outline-none
                            transition
                            focus:border-indigo-500
                            focus:ring-2
                            focus:ring-indigo-500/10
                          "
                        />

                        <p className="mt-1 text-[10px] text-slate-500">
                          Used for SMS appointment confirmation.
                        </p>
                      </div>

                      {/* Email */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                          <Mail className="mr-1 inline h-3 w-3" />
                          Email
                          <span className="ml-1 normal-case tracking-normal text-slate-400">
                            (Optional)
                          </span>
                        </label>

                        <input
                          type="email"
                          value={patientEmail}
                          onChange={(e) =>
                            setPatientEmail(e.target.value)
                          }
                          autoComplete="email"
                          inputMode="email"
                          placeholder="your@email.com"
                          className="
                            min-h-11
                            w-full
                            rounded-2xl
                            border border-slate-300
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            outline-none
                            transition
                            focus:border-indigo-500
                            focus:ring-2
                            focus:ring-indigo-500/10
                          "
                        />
                      </div>

                      {/* Complaint */}
                      <div>
                        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                          <MessageSquare className="mr-1 inline h-3 w-3" />
                          Chief Complaint / Symptoms
                          <span className="ml-1 normal-case tracking-normal text-slate-400">
                            (Optional)
                          </span>
                        </label>

                        <textarea
                          value={chiefComplaint}
                          onChange={(e) =>
                            setChiefComplaint(e.target.value)
                          }
                          rows={3}
                          placeholder="Briefly describe your symptoms or reason for visit..."
                          className="
                            w-full
                            resize-none
                            rounded-2xl
                            border border-slate-300
                            bg-white
                            px-3.5
                            py-2.5
                            text-sm
                            leading-relaxed
                            outline-none
                            transition
                            focus:border-indigo-500
                            focus:ring-2
                            focus:ring-indigo-500/10
                          "
                        />
                      </div>
                    </div>

                    {/* Confirm */}
                    <button
                      type="submit"
                      disabled={
                        isPending ||
                        !patientName.trim() ||
                        !patientPhone.trim()
                      }
                      className="
                        min-h-11
                        w-full
                        inline-flex
                        items-center
                        justify-center
                        gap-2
                        rounded-2xl
                        bg-indigo-600
                        px-5 py-3
                        text-sm font-bold text-white
                        shadow-sm
                        transition
                        hover:bg-indigo-700
                        active:scale-[0.99]
                        disabled:cursor-not-allowed
                        disabled:opacity-60
                        cursor-pointer
                      "
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Booking Serial...
                        </>
                      ) : (
                        <>
                          Confirm Booking
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* =================================
                    STEP 4
                ================================= */}
                {step === 4 && (
                  <div className="space-y-4 py-2 text-center sm:py-4">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                      <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                    </div>

                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Booking Confirmed!
                      </h3>

                      <p className="mx-auto mt-1 max-w-md text-xs sm:text-sm leading-relaxed text-slate-600">
                        Your serial is confirmed. You can track your
                        live queue position and estimated visit time
                        in real-time.
                      </p>
                    </div>

                    {/* Confirmation */}
                    <div
                      className="
                        rounded-2xl
                        border border-emerald-200
                        bg-emerald-50/60
                        p-3.5 sm:p-4
                        text-left
                        space-y-2.5
                      "
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold text-emerald-900">
                          Doctor
                        </span>

                        <span className="max-w-[65%] text-right text-xs font-bold text-slate-900 break-words">
                          {doctorName}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-emerald-900">
                          Serial Number
                        </span>

                        <span className="text-sm font-bold text-indigo-700">
                          #{selectedSlot?.serialNumber}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-semibold text-emerald-900">
                          Date & Time
                        </span>

                        <span className="max-w-[65%] text-right text-xs font-bold text-slate-900 leading-relaxed">
                          {selectedDate &&
                            formatDhakaDate(
                              new Date(
                                `${selectedDate}T00:00:00.000Z`
                              ),
                              {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              }
                            )}
                          {" • "}
                          {selectedSlot &&
                            formatDhakaTime(
                              selectedSlot.startTime
                            )}
                        </span>
                      </div>

                      <div className="space-y-1.5 border-t border-emerald-200/60 pt-2.5">
                        <p className="flex items-start gap-1.5 text-xs font-bold text-slate-900">
                          <Building2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" />

                          <span className="min-w-0 break-words">
                            {getSlotChamberName(selectedSlot)}
                          </span>
                        </p>

                        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-600">
                          <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />

                          <span className="min-w-0 break-words">
                            {getSlotChamberAddress(selectedSlot)}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        onClick={handleClose}
                        className="
                          min-h-11
                          flex-1
                          rounded-2xl
                          border border-slate-300
                          bg-white
                          px-5 py-2.5
                          text-sm font-semibold text-slate-700
                          transition
                          hover:bg-slate-50
                          active:bg-slate-100
                          cursor-pointer
                        "
                      >
                        Close
                      </button>

                      <a
                        href="/dashboard/appointments"
                        className="
                          min-h-11
                          flex-1
                          inline-flex
                          items-center justify-center
                          gap-2
                          rounded-2xl
                          bg-indigo-600
                          px-5 py-2.5
                          text-sm font-bold text-white
                          transition
                          hover:bg-indigo-700
                        "
                      >
                        View Live Queue
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
