"use client";

import { useState, useTransition } from "react";
import { ProfileImageUploader } from "@/components/profile-image-uploader";
import { User, Mail, Phone, ShieldCheck, Check, Edit2, KeyRound, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { updateAccountDetailsAction } from "@/lib/actions/user";
import { changePasswordInDashboardAction } from "@/lib/actions/auth-recovery";

interface ProfileSectionProps {
  user: {
    id: number;
    name: string;
    email: string;
    phone: string | null;
    image: string | null;
    role: string;
  };
}

export default function ProfileSection({ user }: ProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Change Password state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [isChangingPwd, startPwdTransition] = useTransition();

  async function handleSaveDetails(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMsg(null);

    const formData = new FormData();
    formData.append("name", name);
    formData.append("phone", phone);

    const res = await updateAccountDetailsAction(undefined, formData);
    setIsSubmitting(false);

    if (res?.ok) {
      setIsEditing(false);
      setStatusMsg("Profile details saved successfully.");
      setTimeout(() => setStatusMsg(null), 4000);
    } else {
      setStatusMsg(res?.message || "Failed to update profile.");
    }
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPwdMsg(null);

    if (newPassword.length < 8) {
      setPwdMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwdMsg({ ok: false, text: "New passwords do not match." });
      return;
    }

    startPwdTransition(async () => {
      const formData = new FormData();
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);
      formData.append("confirmPassword", confirmPassword);

      const res = await changePasswordInDashboardAction(undefined, formData);
      if (res.ok) {
        setPwdMsg({ ok: true, text: res.message || "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPwdMsg(null);
        }, 2500);
      } else {
        setPwdMsg({ ok: false, text: res.message || "Failed to change password." });
      }
    });
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Your Profile & Avatar</h2>
          <p className="text-sm text-slate-600">
            Manage your personal information, profile picture, and login security.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              <Edit2 className="h-3.5 w-3.5" />
              Edit Info
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowPasswordModal(!showPasswordModal)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition"
          >
            <KeyRound className="h-3.5 w-3.5" />
            {showPasswordModal ? "Close Security" : "Change Password"}
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-medium text-emerald-800 flex items-center gap-2">
          <Check className="h-4 w-4" />
          {statusMsg}
        </div>
      )}

      {/* Change Password Card */}
      {showPasswordModal && (
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
          <div className="flex items-center gap-2 text-indigo-950">
            <Lock className="h-4 w-4 text-indigo-600" />
            <h3 className="text-sm font-bold">Update Account Password</h3>
          </div>

          {pwdMsg && (
            <div
              className={`rounded-xl border px-3.5 py-2.5 text-xs font-medium flex items-center gap-2 ${
                pwdMsg.ok
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-rose-200 bg-rose-50 text-rose-800"
              }`}
            >
              {pwdMsg.ok ? <Check className="h-4 w-4 text-emerald-600" /> : <AlertCircle className="h-4 w-4 text-rose-600" />}
              <span>{pwdMsg.text}</span>
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Current Password
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  type={showPwd ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs focus:border-indigo-500 focus:outline-none bg-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="text-[11px] font-medium text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                {showPwd ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                {showPwd ? "Hide passwords" : "Show passwords"}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isChangingPwd || !currentPassword || !newPassword || !confirmPassword}
                  className="rounded-xl bg-indigo-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition"
                >
                  {isChangingPwd ? "Updating Password..." : "Update Password"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-6">
        {/* Profile Image CRUD */}
        <ProfileImageUploader
          currentImageUrl={user.image}
          userName={user.name}
          label="Profile Picture"
          subLabel="Powered by your personal image hosting API"
        />

        {/* User Information */}
        {isEditing ? (
          <form onSubmit={handleSaveDetails} className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +8801700000000"
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-xl bg-slate-950 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setName(user.name);
                  setPhone(user.phone || "");
                  setIsEditing(false);
                }}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-xs">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">Name</p>
                <p className="truncate text-sm font-semibold text-slate-900">{user.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-xs">
                <Mail className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">Email Address</p>
                <p className="truncate text-sm font-semibold text-slate-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-xs">
                <Phone className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">Phone</p>
                <p className="truncate text-sm font-semibold text-slate-900">
                  {user.phone || "Not set"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-slate-600 shadow-xs">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-500">Account Role</p>
                <span className="inline-flex items-center rounded-lg bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-800">
                  {user.role}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
