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
  Stethoscope,
} from "lucide-react";
import { getAvailableDatesAction, getAvailableSlotsAction, bookAppointmentAction } from "@/lib/actions/queue";

interface BookingModalProps {
  doctorId: number;
  doctorName: string;
  specialty: string | null;
  consultationFee: number | null;
  userLoggedIn: boolean;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
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
}: BookingModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<Array<{ id: number; serialNumber: number; startTime: string }>>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [patientName, setPatientName] = useState(userName || "");
  const [patientPhone, setPatientPhone] = useState(userPhone || "");
  const [patientEmail, setPatientEmail] = useState(userEmail || "");
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [loadingDates, setLoadingDates] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Load available dates when modal opens
  useEffect(() => {
    if (isOpen && availableDates.length === 0) {
      getAvailableDatesAction(doctorId).then((dates) => {
        setAvailableDates(dates);
        setLoadingDates(false);
      }).catch(() => {
        setLoadingDates(false);
      });
    }
  }, [isOpen, doctorId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load slots when date selected
  useEffect(() => {
    if (selectedDate) {
      getAvailableSlotsAction(doctorId, selectedDate).then((slots) => {
        setAvailableSlots(
          slots.map((s) => ({
            id: s.id,
            serialNumber: s.serialNumber,
            startTime: s.startTime.toISOString(),
          }))
        );
        setLoadingSlots(false);
      }).catch(() => {
        setLoadingSlots(false);
      });
    }
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

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  }

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  }

  const selectedSlot = availableSlots.find((s) => s.id === selectedSlotId);

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm w-full sm:w-auto"
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
                  className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
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
                    <p className="text-xs text-slate-500">Select an available day to see times</p>
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
                        This doctor hasn&apos;t published any schedules yet. Please check back later or call the chamber.
                      </p>
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
                            {new Date(date).toLocaleDateString("en-US", { weekday: "short" })}
                          </p>
                          <p className="text-base font-bold text-slate-900 mt-0.5">
                            {new Date(date).getDate()}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            {new Date(date).toLocaleDateString("en-US", { month: "short" })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* STEP 2: Choose Time */}
              {step === 2 && (
                <div className="space-y-4">
                  <div>
                    <button
                      onClick={() => setStep(1)}
                      className="text-xs font-semibold text-indigo-600 hover:underline mb-2"
                    >
                      ← Change date
                    </button>
                    <h3 className="text-sm font-bold text-slate-900">
                      Choose Time — {selectedDate && formatDate(selectedDate)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Select an available serial
                    </p>
                  </div>

                  {loadingSlots ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <Clock className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-sm font-semibold text-slate-700">No slots available on this date</p>
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
                            {formatTime(slot.startTime)}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Serial #{slot.serialNumber}
                          </p>
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
                      className="text-xs font-semibold text-indigo-600 hover:underline mb-2"
                      type="button"
                    >
                      ← Change time
                    </button>

                    <div className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-3.5 mb-4">
                      <p className="text-xs text-slate-600">Your appointment</p>
                      <p className="text-sm font-bold text-slate-900">
                        {doctorName} • {selectedDate && formatDate(selectedDate)} • {selectedSlot && formatTime(selectedSlot.startTime)}
                      </p>
                      <p className="text-xs text-indigo-700 font-semibold mt-0.5">
                        Serial #{selectedSlot?.serialNumber}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <User className="inline h-3 w-3 mr-1" />
                        Full Name
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
                        Phone Number
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
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                        <MessageSquare className="inline h-3 w-3 mr-1" />
                        Chief Complaint (Optional)
                      </label>
                      <textarea
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        rows={2}
                        placeholder="Briefly describe your symptoms..."
                        className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none resize-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isPending || !patientName.trim() || !patientPhone.trim()}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Booking...
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
                      Your serial is locked. We&apos;ll send you a confirmation email and you can check live queue position from your account.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <button
                      onClick={handleClose}
                      className="flex-1 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Close
                    </button>
                    <a
                      href="/dashboard/appointments"
                      className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                    >
                      View My Appointments
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
