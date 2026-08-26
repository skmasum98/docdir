"use client";

import { useActionState, useState, useRef } from "react";
import Link from "next/link";
import { registerAction } from "@/lib/actions/auth";
import { initialFormState, fieldError } from "@/lib/form";
import { Camera, User, X } from "lucide-react";
import Image from "next/image";

export default function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerAction, initialFormState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }

  function handleClearImage() {
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm ${
            state.ok
              ? "border-emerald-300 bg-emerald-50 text-emerald-900"
              : "border-rose-300 bg-rose-50 text-rose-900"
          }`}
        >
          {state.message}
        </div>
      )}

      {/* Optional Profile Photo */}
      <div className="flex flex-col items-center justify-center gap-2 pb-1">
        <div className="relative group">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-slate-300 bg-slate-100 text-slate-400">
            {previewUrl ? (
              <Image
                src={previewUrl}
                alt="Avatar preview"
                width={80}
                height={80}
                className="h-full w-full object-cover"
                unoptimized
              />
            ) : (
              <User className="h-10 w-10 text-slate-400" />
            )}
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow hover:bg-slate-800"
            title="Upload photo"
          >
            <Camera className="h-3.5 w-3.5" />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          name="image"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-semibold text-indigo-700 hover:underline"
          >
            {previewUrl ? "Change photo" : "Add profile photo (optional)"}
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={handleClearImage}
              className="text-xs text-rose-600 hover:underline flex items-center gap-0.5"
            >
              <X className="h-3 w-3" /> Remove
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Full name</label>
        <input
          name="name"
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "name") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "name")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <input
          name="email"
          type="email"
          required
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "email") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "email")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone (optional)</label>
        <input
          name="phone"
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "phone") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "phone")}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
        <input
          name="password"
          type="password"
          required
          minLength={8}
          className="w-full rounded-2xl border border-slate-300 px-4 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
        {fieldError(state, "password") && (
          <p className="mt-1 text-xs text-rose-700">{fieldError(state, "password")}</p>
        )}
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-slate-700">I am registering as</legend>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-slate-300 p-3 text-sm has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50">
            <input type="radio" name="role" value="PATIENT" defaultChecked />
            <span>
              <span className="block font-semibold">Patient</span>
              <span className="block text-xs text-slate-500">Find and review doctors</span>
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-2 rounded-2xl border border-slate-300 p-3 text-sm has-[:checked]:border-slate-950 has-[:checked]:bg-slate-50">
            <input type="radio" name="role" value="DOCTOR" />
            <span>
              <span className="block font-semibold">Doctor</span>
              <span className="block text-xs text-slate-500">
                Create and update your profile
              </span>
            </span>
          </label>
        </div>
      </fieldset>

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-2xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
      >
        {pending ? "Creating account..." : "Create account"}
      </button>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-slate-900 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
