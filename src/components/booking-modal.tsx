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
import { getAvailableDatesAction, getAvailableSlotsAction, bookAppointmentAction } from "@/lib/actions/queue";
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
  doctor?: {
    hospitalName?: string | null;
    chamberAddress?: string | null;
    city?: string | null;
    area?: string | null;
    appointmentPhone?: string | null;
  } | null;
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
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<AvailableSlotItem[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState(userName || "");
  const [patientPhone, setPatientPhone] = useState(userPhone || "");
  const [patientEmail, setPatientEmail] = useState(userEmail || "");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load available dates when modal opens
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

  // Load slots when date selected
  useEffect(() => {
    if (!selectedDate) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setLoadingSlots(true);
    });

    getAvailableSlotsAction(doctorId, selectedDate)
      .then((slots) => {
        if (!cancelled) {
          setAvailableSlots(
            slots.map((s: any) => ({
              id: s.id,
              serialNumber: s.serialNumber,
              startTime: typeof s.startTime === "string" ? s.startTime : s.startTime.toISOString(),
              endTime: typeof s.endTime === "string" ? s.endTime : s.endTime.toISOString(),
              facility: s.facility || null,
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

  function reset() {
    setStep(1);
    setSelectedDate("");
    setSelectedSlotId(null);
    setPatientName(userName || "");
    setPatientPhone(userPhone || "");
    setPatientEmail(userEmail || "");
    setChiefComplaint("");
    setMessage(null);
  }

  function handleOpen() {
    if (!userLoggedIn) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    setIsOpen(true);
  }

  function handleClose() {
    setIsOpen(false);
    setTimeout(reset, 300);
  }

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
        setStep(4); // Success
        setMessage({ type: "success", text: result.message });
      } else {
        setMessage({ type: "error", text: result.message });
      }
    });
  }

  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  // Helper to resolve slot's chamber name
  function getSlotChamberName(slot?: AvailableSlotItem): string {
    if (slot?.facility?.name) return slot.facility.name;
    if (slot?.doctor?.hospitalName) return slot.doctor.hospitalName;
    if (hospitalName) return hospitalName;
    return "Doctor's Chamber";
  }

  // Helper to resolve slot's chamber address
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
      const parts = [chamberAddress, area, city].filter(Boolean);
      return parts.join(", ");
    }
    if (city || area) {
      return [area, city].filter(Boolean).join(", ");
    }
    return "Chamber address available on appointment confirmation";
  }

  // Default chamber info for current selection
  const currentChamberName = getSlotChamberName(selectedSlot || availableSlots[0]);
  const currentChamberAddress = getSlotChamberAddress(selectedSlot || availableSlots[0]);

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm w-full sm:w-auto cursor-pointer"
      >
        <Calendar className="h-4 w-4" />
        Book Serial Online
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={handleClose}
        >
          <div
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-6 py-4 rounded-t-3xl z-10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">Book Serial</h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {doctorName}
                    {specialty ? ` • ${specialty}` : ""}
                    {consultationFee ? ` • ৳${consultationFee}` : ""}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              {/* Stepper */}
              <div className="flex items-center gap-1.5 mt-3">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`flex-1 h-1 rounded-full ${
                      step >= s ? "bg-indigo-600" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div className="p-5 sm:p-6 space-y-5">
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

              {/* STEP 1: Choose Date */}
              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 mb-1">Choose Date</h3>
                    <p className="text-xs text-slate-500">Select an available day to see chamber slots</p>
                  </div>

                  {loadingDates ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : availableDates.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No available dates</p>
                      <p className="text-xs text-slate-500 mt-1">
                        This doctor hasn&apos;t published any open schedules yet. Please check back later or call the chamber.
                      </p>
                      {appointmentPhone && (
                        <p className="text-xs font-semibold text-indigo-700 mt-3">
                          Chamber Hotline: {appointmentPhone}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableDates.map((date) => (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date);
                            setStep(2);
                          }}
                          className={`rounded-2xl border p-3 text-center transition cursor-pointer ${
                            selectedDate === date
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                          }`}
                        >
                          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                            {formatDhakaDate(new Date(`${date}T00:00:00.000Z`), { weekday: "short" })}
                          </p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">
                            {formatDhakaDate(new Date(`${date}T00:00:00.000Z`), { day: "numeric" })}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {formatDhakaDate(new Date(`${date}T00:00:00.000Z`), { month: "short" })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Choose Time & View Chamber Address */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-indigo-600 hover:underline mb-2 cursor-pointer"
                    >
                      ← Change date
                    </button>
                    <h3 className="text-sm font-bold text-slate-900">
                      Choose Time — {selectedDate && formatDhakaDate(new Date(`${selectedDate}T00:00:00.000Z`), { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select an available serial for consultation
                    </p>
                  </div>

                  {/* Chamber Address Box */}
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50/80 to-blue-50/50 p-4 space-y-1.5">
                    <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
                      <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>{currentChamberName}</span>
                    </div>
                    <div className="flex items-start gap-2 text-slate-600 text-xs pl-0.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{currentChamberAddress}</span>
                    </div>
                  </div>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No slots available on this date</p>
                      <p className="text-xs text-slate-500 mt-1">Please select another date from the calendar.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button
                          key={slot.id}
                          onClick={() => {
                            setSelectedSlotId(slot.id);
                            setStep(3);
                          }}
                          className={`rounded-2xl border p-3 text-center transition cursor-pointer ${
                            selectedSlotId === slot.id
                              ? "border-indigo-600 bg-indigo-50 text-indigo-900"
                              : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50"
                          }`}
                        >
                          <p className="text-xs font-bold text-slate-900">
                            {formatDhakaTime(slot.startTime)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            Serial #{slot.serialNumber}
                          </p>
                          {slot.facility?.name && slot.facility.name !== currentChamberName && (
                            <p className="text-[9px] text-indigo-600 truncate mt-1">
                              {slot.facility.name}
                            </p>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 3: Patient Info */}
              {step === 3 && (
                <form onSubmit={handleBook} className="space-y-4">
                  <div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-xs font-semibold text-indigo-600 hover:underline mb-2 cursor-pointer"
                      type="button"
                    >
                      ← Change time
                    </button>

                    {/* Rich Appointment & Chamber Summary Card */}
                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4 space-y-2.5">
                      <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-700">
                            Appointment Summary
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-0.5">
                            {doctorName} {specialty ? `(${specialty})` : ""}
                          </p>
                        </div>
                        <span className="rounded-xl bg-indigo-600 px-2.5 py-1 text-xs font-bold text-white shadow-xs">
                          Serial #{selectedSlot?.serialNumber}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{selectedDate && formatDhakaDate(new Date(`${selectedDate}T00:00:00.000Z`), { weekday: "short", day: "numeric", month: "short" })}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{selectedSlot && formatDhakaTime(selectedSlot.startTime)}</span>
                        </div>
                      </div>

                      {/* Chamber Location in Summary */}
                      <div className="pt-2 border-t border-indigo-100 space-y-1">
                        <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          {getSlotChamberName(selectedSlot)}
                        </p>
                        <p className="text-[11px] text-slate-600 flex items-start gap-1.5 pl-0.5">
                          <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                          <span>{getSlotChamberAddress(selectedSlot)}</span>
                        </p>
                      </div>

                      {consultationFee && (
                        <div className="pt-1 text-[11px] text-indigo-900 font-semibold flex justify-between">
                          <span>Consultation Fee:</span>
                          <span>৳{consultationFee}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <User className="inline h-3 w-3 mr-1" />
                        Patient Full Name
                      </label>
                      <input
                        type="text"
                        value={patientName}
                        onChange={(e) => setPatientName(e.target.value)}
                        required
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <Phone className="inline h-3 w-3 mr-1" />
                        Phone Number (for SMS confirmation)
                      </label>
                      <input
                        type="tel"
                        value={patientPhone}
                        onChange={(e) => setPatientPhone(e.target.value)}
                        required
                        placeholder="01700000000"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <Mail className="inline h-3 w-3 mr-1" />
                        Email (Optional)
                      </label>
                      <input
                        type="email"
                        value={patientEmail}
                        onChange={(e) => setPatientEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <MessageSquare className="inline h-3 w-3 mr-1" />
                        Chief Complaint / Symptoms (Optional)
                      </label>
                      <textarea
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        rows={2}
                        placeholder="Briefly describe your symptoms or reason for visit..."
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !patientName.trim() || !patientPhone.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60 cursor-pointer"
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

              {/* STEP 4: Success */}
              {step === 4 && (
                <div className="text-center py-4 space-y-4">
                  <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">Booking Confirmed!</h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Your serial is confirmed. You can track your live queue position and estimated visit time in real-time.
                    </p>
                  </div>

                  {/* Confirmed Details Badge */}
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-900">Doctor</span>
                      <span className="text-xs font-bold text-slate-900">{doctorName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-900">Serial Number</span>
                      <span className="text-sm font-bold text-indigo-700">#{selectedSlot?.serialNumber}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-900">Date & Time</span>
                      <span className="text-xs font-bold text-slate-900">
                        {selectedDate && formatDhakaDate(new Date(`${selectedDate}T00:00:00.000Z`), { weekday: "short", day: "numeric", month: "short" })} • {selectedSlot && formatDhakaTime(selectedSlot.startTime)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-emerald-200/60">
                      <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-emerald-700 shrink-0" />
                        {getSlotChamberName(selectedSlot)}
                      </p>
                      <p className="text-[11px] text-slate-600 flex items-start gap-1.5 mt-0.5">
                        <MapPin className="h-3 w-3 text-slate-400 shrink-0 mt-0.5" />
                        <span>{getSlotChamberAddress(selectedSlot)}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={handleClose}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      Close
                    </button>
                    <a
                      href="/dashboard/appointments"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                    >
                      View Live Queue
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
