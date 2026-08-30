"use client";

import { useState, useTransition } from "react";
import {
  UserPlus,
  Mail,
  Phone,
  Shield,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  AlertCircle,
  User,
  KeyRound,
  Power,
} from "lucide-react";
import {
  createReceptionistAction,
  updateReceptionistAction,
  resetReceptionistPasswordAction,
  deleteReceptionistAction,
} from "@/lib/actions/receptionist";

interface Receptionist {
  id: number;
  doctorId: number;
  userId: number;
  name: string;
  phone: string;
  canCancel: boolean;
  canBookOffline: boolean;
  canMarkNoShow: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user: { id: number; name: string; email: string; isActive: boolean };
}

export default function ReceptionistsManager({
  doctorName,
  initialReceptionists,
}: {
  doctorName: string;
  initialReceptionists: Receptionist[];
}) {
  const [receptionists, setReceptionists] = useState<Receptionist[]>(initialReceptionists);
  const [isCreating, setIsCreating] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [createdPassword, setCreatedPassword] = useState<{ email: string; password: string; name: string } | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [canCancel, setCanCancel] = useState(true);
  const [canBookOffline, setCanBookOffline] = useState(true);
  const [canMarkNoShow, setCanMarkNoShow] = useState(true);

  function showMessage(type: "success" | "error", text: string) {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await createReceptionistAction({
        name,
        email,
        phone,
        password: password || undefined,
        canCancel,
        canBookOffline,
        canMarkNoShow,
      });

      if (result.ok) {
        showMessage("success", result.message);
        setIsCreating(false);
        setName("");
        setEmail("");
        setPhone("");
        setPassword("");
        setCanCancel(true);
        setCanBookOffline(true);
        setCanMarkNoShow(true);

        // If auto-generated password, show it to the doctor
        if (result.data?.tempPassword) {
          setCreatedPassword({
            email: result.data.email,
            password: result.data.tempPassword,
            name,
          });
        } else {
          window.location.reload();
        }
      } else {
        showMessage("error", result.message);
      }
    });
  }

  function handleToggleActive(id: number, isActive: boolean) {
    startTransition(async () => {
      const result = await updateReceptionistAction(id, { isActive: !isActive });
      if (result.ok) {
        showMessage("success", result.message);
        setReceptionists((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: !isActive } : r))
        );
      } else {
        showMessage("error", result.message);
      }
    });
  }

  function handleResetPassword(id: number, name: string) {
    if (!confirm(`Reset password for ${name}? A new random password will be generated.`)) return;

    startTransition(async () => {
      const result = await resetReceptionistPasswordAction(id);
      if (result.ok && result.data?.tempPassword) {
        setCreatedPassword({
          email: receptionists.find((r) => r.id === id)?.user.email || "",
          password: result.data.tempPassword,
          name,
        });
      } else {
        showMessage("error", result.message || "Failed to reset password");
      }
    });
  }

  function handleDelete(id: number, name: string) {
    if (!confirm(`Deactivate ${name}? They will no longer be able to log in.`)) return;

    startTransition(async () => {
      const result = await deleteReceptionistAction(id);
      if (result.ok) {
        showMessage("success", result.message);
        setReceptionists((prev) =>
          prev.map((r) => (r.id === id ? { ...r, isActive: false, user: { ...r.user, isActive: false } } : r))
        );
      } else {
        showMessage("error", result.message);
      }
    });
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    showMessage("success", "Copied to clipboard");
  }

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

      {/* Show credentials modal */}
      {createdPassword && (
        <div className="rounded-3xl border-2 border-emerald-300 bg-emerald-50 p-5 sm:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h3 className="text-sm sm:text-base font-bold text-emerald-900">Receptionist Account Created!</h3>
          </div>
          <p className="text-xs sm:text-sm text-emerald-800">
            Share these credentials securely with <strong>{createdPassword.name}</strong>:
          </p>
          <div className="space-y-2 bg-white rounded-2xl p-3.5 border border-emerald-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Email</p>
                <p className="text-sm font-mono text-slate-900">{createdPassword.email}</p>
              </div>
              <button
                onClick={() => copyToClipboard(createdPassword.email)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                title="Copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div>
                <p className="text-[10px] font-semibold uppercase text-slate-500">Password</p>
                <p className="text-sm font-mono font-bold text-slate-900">{createdPassword.password}</p>
              </div>
              <button
                onClick={() => copyToClipboard(createdPassword.password)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                title="Copy"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-emerald-700 italic">
            ⚠️ Save this password now. For security, it won&apos;t be shown again. The receptionist can change it after first login.
          </p>
          <button
            onClick={() => {
              setCreatedPassword(null);
              window.location.reload();
            }}
            className="w-full rounded-2xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 transition"
          >
            Done
          </button>
        </div>
      )}

      {!isCreating && !createdPassword && (
        <button
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800 transition shadow-sm"
        >
          <UserPlus className="h-4 w-4" />
          Add New Receptionist
        </button>
      )}

      {isCreating && !createdPassword && (
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/30 p-5 sm:p-7 space-y-4">
          <header className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">New Receptionist Account</h2>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </header>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Phone
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="01700000000"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-700">
                  Password (leave blank to auto-generate)
                </label>
                <input
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Auto-generated if empty"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 mb-2">Permissions</p>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canBookOffline}
                    onChange={(e) => setCanBookOffline(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Book walk-in patients (offline serials)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canCancel}
                    onChange={(e) => setCanCancel(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Cancel any appointment</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={canMarkNoShow}
                    onChange={(e) => setCanMarkNoShow(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-slate-700">Mark patients as no-show</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-60"
            >
              {isPending ? "Creating..." : "Create Receptionist"}
            </button>
          </form>
        </section>
      )}

      {/* List */}
      <section className="space-y-3">
        {receptionists.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <User className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-700">No receptionists yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Add a receptionist so they can book offline serials on your behalf.
            </p>
          </div>
        ) : (
          receptionists.map((r) => (
            <div
              key={r.id}
              className={`rounded-2xl border bg-white p-4 sm:p-5 ${
                r.isActive ? "border-slate-200" : "border-slate-200 bg-slate-50/50 opacity-70"
              }`}
            >
              <div className="flex items-start justify-between gap-3 flex-col sm:flex-row">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {r.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-slate-900">{r.name}</p>
                      {!r.isActive && (
                        <span className="rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                      <Mail className="h-3 w-3" />
                      <span className="truncate">{r.user.email}</span>
                    </p>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {r.phone}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {r.canBookOffline && (
                        <span className="rounded-md bg-blue-50 border border-blue-200 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
                          Book Offline
                        </span>
                      )}
                      {r.canCancel && (
                        <span className="rounded-md bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700">
                          Cancel
                        </span>
                      )}
                      {r.canMarkNoShow && (
                        <span className="rounded-md bg-rose-50 border border-rose-200 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                          No-show
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => handleResetPassword(r.id, r.name)}
                    disabled={isPending || !r.isActive}
                    className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
                    title="Reset password"
                  >
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(r.id, r.isActive)}
                    disabled={isPending}
                    className={`p-2 rounded-xl transition ${
                      r.isActive ? "text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50"
                    }`}
                    title={r.isActive ? "Deactivate" : "Activate"}
                  >
                    <Power className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
