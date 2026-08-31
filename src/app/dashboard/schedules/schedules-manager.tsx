"use client";

import { useState, useTransition } from "react";
import { Calendar, Plus, Trash2, Clock, Users, AlertCircle, CheckCircle2, Building2, Ban, Edit, X, ChevronLeft, ChevronRight, Eye, MapPin } from "lucide-react";
import {
  createSlotBlockAction,
  updateScheduleBlockAction,
  deleteScheduleBlockAction,
  cancelScheduleBlockAction,
} from "@/lib/actions/queue";
import { formatDhakaDate, formatDhakaTime, getTodayDhaka, isTodayDhaka, dhakaDateToUTC, getDhakaDateString } from "@/lib/timezone";

interface ScheduleBlock {
  id: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDuration: number;
  maxPatients: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  facility: {
    id: number;
    name: string;
    type?: string;
    address?: string | null;
    upazila?: { name: string; district?: { name: string } | null } | null;
  } | null;
  createdAt: string;
  updatedAt: string;
  _count?: { slots: number };
}

interface SchedulesManagerProps {
  doctorId: number;
  facilities: Array<{ id: number; name: string; type: string; address?: string | null }>;
  initialBlocks: ScheduleBlock[];
}

export default function SchedulesManager({
  doctorId,
  facilities,
  initialBlocks,
}: SchedulesManagerProps) {
  const [blocks, setBlocks] = useState<ScheduleBlock[]>(initialBlocks);
  const [isCreating, setIsCreating] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ScheduleBlock | null>(null);
  const [viewingBlock, setViewingBlock] = useState<ScheduleBlock | null>(null);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state for create
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [startTime, setStartTime] = useState("17:00");
  const [endTime, setEndTime] = useState("21:00");
  const [slotDuration, setSlotDuration] = useState("10");
  const [maxPatients, setMaxPatients] = useState("20");
  const [facilityId, setFacilityId] = useState("");
  const [notes, setNotes] = useState("");
  const [chamberOff, setChamberOff] = useState(false);

  // Calendar state - show 30 days
  const [calendarStart, setCalendarStart] = useState<string>(getTodayDhaka());

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function resetForm() {
    setSelectedDate("");
    setStartTime("17:00");
    setEndTime("21:00");
    setSlotDuration("10");
    setMaxPatients("20");
    setFacilityId("");
    setNotes("");
    setChamberOff(false);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedDate) {
      showMessage("error", "Please select a date");
      return;
    }

    startTransition(async () => {
      const result = await createSlotBlockAction({
        date: selectedDate,
        startTime,
        endTime,
        slotDuration: Number(slotDuration),
        maxPatients: Number(maxPatients),
        facilityId: facilityId ? Number(facilityId) : null,
        notes: notes || (chamberOff ? "Chamber off" : undefined),
      });

      if (result.ok) {
        showMessage("success", result.message);
        setIsCreating(false);
        resetForm();
        // Refresh data
        setTimeout(() => window.location.reload(), 500);
      } else {
        showMessage("error", result.message);
      }
    });
  }

  function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingBlock) return;

    startTransition(async () => {
      const result = await updateScheduleBlockAction(editingBlock.id, {
        startTime,
        endTime,
        slotDuration: Number(slotDuration),
        maxPatients: Number(maxPatients),
        notes: notes || null,
        isActive: !chamberOff,
      });

      if (result.ok) {
        showMessage("success", result.message || "Success");
        setEditingBlock(null);
        setTimeout(() => window.location.reload(), 500);
      } else {
        showMessage("error", result.message || "Failed");
      }
    });
  }

  function handleDelete(blockId: number) {
    if (!confirm("Delete this schedule? All future slots will be removed and patient appointments will be cancelled.")) return;

    startTransition(async () => {
      const result = await deleteScheduleBlockAction(blockId);
      if (result.ok) {
        showMessage("success", result.message || "Deleted");
        setBlocks((prev) => prev.filter((b) => b.id !== blockId));
        setViewingBlock(null);
      } else {
        showMessage("error", result.message || "Failed");
      }
    });
  }

  function handleChamberOff(blockId: number) {
    const reason = prompt("Reason for chamber off? (optional)") || "Chamber off";
    if (reason === null) return;

    startTransition(async () => {
      const result = await cancelScheduleBlockAction(blockId, reason);
      if (result.ok) {
        showMessage("success", result.message || "Cancelled");
        setTimeout(() => window.location.reload(), 500);
      } else {
        showMessage("error", result.message || "Failed");
      }
    });
  }

  function startEdit(block: ScheduleBlock) {
    setEditingBlock(block);
    setStartTime(block.startTime);
    setEndTime(block.endTime);
    setSlotDuration(String(block.slotDuration));
    setMaxPatients(String(block.maxPatients));
    setNotes(block.notes || "");
    setChamberOff(!block.isActive);
  }

  // Generate calendar days (14 days from calendarStart)
  function generateCalendarDays() {
    const days: Array<{ date: string; label: string; dayNum: number; isToday: boolean; hasBlock: boolean; block?: ScheduleBlock }> = [];
    const start = dhakaDateToUTC(calendarStart);

    for (let i = 0; i < 14; i++) {
      const d = new Date(start);
      d.setUTCDate(start.getUTCDate() + i);
      const dateStr = getDhakaDateString(d);
      const block = blocks.find(
        (b) => b.effectiveFrom.startsWith(dateStr)
      );

      days.push({
        date: dateStr,
        label: formatDhakaDate(d, { weekday: "short" }),
        dayNum: Number(formatDhakaDate(d, { day: "numeric" })),
        isToday: isTodayDhaka(dateStr),
        hasBlock: !!block,
        block,
      });
    }
    return days;
  }

  function navigateCalendar(direction: -1 | 1) {
    const start = dhakaDateToUTC(calendarStart);
    start.setUTCDate(start.getUTCDate() + direction * 7);
    setCalendarStart(getDhakaDateString(start));
  }

  const calendarDays = generateCalendarDays();

  // Sort blocks by date (upcoming first)
  const todayDhaka = getTodayDhaka();
  const upcomingBlocks = blocks
    .filter((b) => b.effectiveFrom.startsWith(todayDhaka) || b.effectiveFrom >= todayDhaka)
    .sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));

  const pastBlocks = blocks
    .filter((b) => b.effectiveFrom < todayDhaka)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));

  return (
    <div className="space-y-6">
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

      {/* Create button */}
      {!isCreating && !editingBlock && (
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition shadow-sm"
        >
          <Plus className="h-4 w-4" />
          Create Chamber Schedule
        </button>
      )}

      {/* Create Form */}
      {isCreating && (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/30 p-5 sm:p-7 space-y-5">
          <header className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">New Chamber Schedule</h2>
            <button
              onClick={() => {
                setIsCreating(false);
                resetForm();
              }}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </header>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Chamber Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={todayDhaka}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                {selectedDate && (
                  <p className="mt-1 text-[11px] text-slate-500">
                    {new Date(selectedDate).toLocaleDateString("en-GB", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Location (Optional)
                </label>
                <select
                  value={facilityId}
                  onChange={(e) => setFacilityId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="">— Doctor&apos;s Default Location —</option>
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Slot Duration (minutes)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="5">5 min (very quick)</option>
                  <option value="10">10 min (standard)</option>
                  <option value="15">15 min (detailed)</option>
                  <option value="20">20 min (thorough)</option>
                  <option value="30">30 min (consultation)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Max Patients
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={maxPatients}
                  onChange={(e) => setMaxPatients(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
                <p className="mt-1 text-[11px] text-slate-500">
                  {(() => {
                    const [sh, sm] = startTime.split(":").map(Number);
                    const [eh, em] = endTime.split(":").map(Number);
                    const total = (eh * 60 + em) - (sh * 60 + sm);
                    const possible = Math.floor(total / Number(slotDuration));
                    return `${possible} slots possible. Max will be capped at ${Math.min(possible, Number(maxPatients))}.`;
                  })()}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Notice / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., 'First come first served' or special instructions"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chamberOff}
                onChange={(e) => setChamberOff(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-700">Mark as &ldquo;Chamber Off&rdquo; (don&apos;t allow bookings)</span>
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isPending || !selectedDate}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
              >
                {isPending ? "Creating..." : "Create Schedule"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  resetForm();
                }}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Edit Form */}
      {editingBlock && (
        <section className="rounded-3xl border border-amber-200 bg-amber-50/30 p-5 sm:p-7 space-y-5">
          <header className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              Edit Schedule: {formatDhakaDate(editingBlock.effectiveFrom, { weekday: "short", day: "numeric", month: "short" })}
            </h2>
            <button
              onClick={() => setEditingBlock(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </header>

          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Slot Duration (minutes)
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                >
                  <option value="5">5 min</option>
                  <option value="10">10 min</option>
                  <option value="15">15 min</option>
                  <option value="20">20 min</option>
                  <option value="30">30 min</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Max Patients
                </label>
                <input
                  type="number"
                  min="1"
                  max="200"
                  value={maxPatients}
                  onChange={(e) => setMaxPatients(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                Notice / Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g., 'First come first served'"
                className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={chamberOff}
                onChange={(e) => setChamberOff(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-sm text-slate-700">Mark as &ldquo;Chamber Off&rdquo; (cancel all bookings)</span>
            </label>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-700 transition shadow-sm disabled:opacity-60"
              >
                {isPending ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setEditingBlock(null)}
                className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </section>
      )}

      {/* View Block Modal */}
      {viewingBlock && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setViewingBlock(null)}
        >
          <div
            className="relative w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-slate-200 px-5 sm:px-6 py-4 rounded-t-3xl z-10 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">Schedule Details</h2>
                <p className="text-xs text-slate-600 mt-0.5">
                  {formatDhakaDate(viewingBlock.effectiveFrom, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <button
                onClick={() => setViewingBlock(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Time</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{viewingBlock.startTime} – {viewingBlock.endTime}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Slot Duration</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{viewingBlock.slotDuration} min</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Max Patients</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{viewingBlock.maxPatients}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-600">Total Slots</p>
                  <p className="text-sm font-bold text-slate-900 mt-1">{viewingBlock._count?.slots || 0}</p>
                </div>
              </div>

              {viewingBlock.facility && (
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 space-y-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-700">Location / Chamber</p>
                  <p className="text-sm font-bold text-blue-900 flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-blue-700 shrink-0" />
                    {viewingBlock.facility.name}
                  </p>
                  {viewingBlock.facility.address && (
                    <p className="text-xs text-blue-800 flex items-start gap-1 pl-0.5 mt-0.5">
                      <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <span>
                        {[
                          viewingBlock.facility.address,
                          viewingBlock.facility.upazila?.name,
                          viewingBlock.facility.upazila?.district?.name,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                    </p>
                  )}
                </div>
              )}

              {viewingBlock.notes && (
                <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">Notice</p>
                  <p className="text-sm text-amber-900 mt-1">{viewingBlock.notes}</p>
                </div>
              )}

              {!viewingBlock.isActive && (
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3">
                  <p className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                    <Ban className="h-4 w-4" /> Chamber Off
                  </p>
                  <p className="text-xs text-rose-700 mt-0.5">This schedule is currently disabled. Patients cannot book.</p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    setViewingBlock(null);
                    startEdit(viewingBlock);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleChamberOff(viewingBlock.id)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-amber-700 transition"
                >
                  <Ban className="h-4 w-4" />
                  Chamber Off
                </button>
                <button
                  onClick={() => handleDelete(viewingBlock.id)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-rose-700 transition"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar quick view */}
      {!isCreating && !editingBlock && (
        <section className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
          <header className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-indigo-600" />
              Calendar (next 2 weeks)
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={() => navigateCalendar(-1)}
                disabled={calendarStart <= todayDhaka}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigateCalendar(1)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </header>

          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {calendarDays.map((d) => (
              <button
                key={d.date}
                onClick={() => {
                  setSelectedDate(d.date);
                  if (!d.hasBlock) {
                    setIsCreating(true);
                  } else if (d.block) {
                    setViewingBlock(d.block);
                  }
                }}
                className={`shrink-0 rounded-2xl border p-2.5 text-center transition min-w-[68px] ${
                  d.hasBlock
                    ? d.block?.isActive
                      ? "border-indigo-300 bg-indigo-50 hover:bg-indigo-100"
                      : "border-rose-200 bg-rose-50/30 hover:bg-rose-50"
                    : "border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50"
                }`}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  {d.label}
                </p>
                <p className={`text-base font-bold mt-0.5 ${d.hasBlock ? (d.block?.isActive ? "text-indigo-700" : "text-rose-700") : "text-slate-900"}`}>
                  {d.dayNum}
                </p>
                {d.hasBlock && (
                  <span className={`inline-block mt-1 rounded-full px-1.5 py-0 text-[8px] font-bold ${d.block?.isActive ? "bg-indigo-200 text-indigo-800" : "bg-rose-200 text-rose-800"}`}>
                    {d.block?.isActive ? "OPEN" : "OFF"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Schedules */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Calendar className="h-4 w-4 text-indigo-600" />
          Upcoming Schedules ({upcomingBlocks.length})
        </h2>

        {upcomingBlocks.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No upcoming schedules</p>
            <p className="text-xs text-slate-500 mt-1">
              Create a schedule to start accepting patient bookings.
            </p>
          </div>
        ) : (
          upcomingBlocks.map((block) => (
            <div
              key={block.id}
              className={`rounded-2xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                block.isActive
                  ? "border-slate-200 bg-white"
                  : "border-rose-200 bg-rose-50/30"
              }`}
            >
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-bold text-slate-900">
                    {formatDhakaDate(block.effectiveFrom, { weekday: "long", day: "numeric", month: "long" })}
                  </p>
                  {isTodayDhaka(block.effectiveFrom) && (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      TODAY
                    </span>
                  )}
                  {!block.isActive && (
                    <span className="inline-flex items-center rounded-md bg-rose-100 border border-rose-200 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      <Ban className="h-3 w-3 mr-1" /> Chamber Off
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {block.startTime} – {block.endTime}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {block._count?.slots || 0} slots
                  </span>
                  <span>•</span>
                  <span>{block.slotDuration} min/slot</span>
                  {block.facility && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                        <Building2 className="h-3 w-3" />
                        {block.facility.name}
                      </span>
                      {block.facility.address && (
                        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-500">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {block.facility.address}
                        </span>
                      )}
                    </>
                  )}
                </div>
                {block.notes && (
                  <p className="text-xs text-slate-500 italic">&ldquo;{block.notes}&rdquo;</p>
                )}
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setViewingBlock(block)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition"
                  title="View details"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  onClick={() => startEdit(block)}
                  className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 transition"
                  title="Edit"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleChamberOff(block.id)}
                  className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 transition"
                  title="Chamber off"
                >
                  <Ban className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(block.id)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition"
                  title="Delete"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </section>

      {/* Past Schedules (collapsible) */}
      {pastBlocks.length > 0 && (
        <details className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-5">
          <summary className="cursor-pointer text-sm font-bold text-slate-700 flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Past Schedules ({pastBlocks.length})
          </summary>
          <div className="space-y-2 mt-3">
            {pastBlocks.slice(0, 10).map((block) => (
              <div
                key={block.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2 opacity-70"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    {formatDhakaDate(block.effectiveFrom, { weekday: "short", day: "numeric", month: "short" })}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {block.startTime}-{block.endTime} • {block._count?.slots || 0} slots
                  </p>
                </div>
                <button
                  onClick={() => setViewingBlock(block)}
                  className="text-xs text-indigo-600 font-semibold"
                >
                  View
                </button>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
