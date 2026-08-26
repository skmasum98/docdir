"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Upload, Trash2, Loader2, Camera, Check } from "lucide-react";
import { UserAvatar } from "./user-avatar";

interface ProfileImageUploaderProps {
  currentImageUrl?: string | null;
  userName?: string | null;
  onImageUploaded?: (url: string | null) => void;
  autoSave?: boolean;
  saveAction?: (formData: FormData) => Promise<any>;
  removeAction?: () => Promise<any>;
  label?: string;
  subLabel?: string;
}

export function ProfileImageUploader({
  currentImageUrl,
  userName,
  onImageUploaded,
  autoSave = true,
  saveAction,
  removeAction,
  label = "Profile Photo",
  subLabel = "Upload JPG, PNG, or WEBP (hosted on personal image API)",
}: ProfileImageUploaderProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(currentImageUrl ?? null);
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(file: File) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, WEBP, etc.).");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be under 10MB.");
      return;
    }

    setError(null);
    setSuccessMessage(null);
    setIsUploading(true);

    try {
      if (saveAction) {
        const formData = new FormData();
        formData.append("image", file);
        const result = await saveAction(formData);
        if (result && !result.ok) {
          throw new Error(result.message || "Failed to upload image.");
        }
        if (result?.data?.imageUrl) {
          setImageUrl(result.data.imageUrl);
          onImageUploaded?.(result.data.imageUrl);
        }
      } else {
        // Upload via API route
        const formData = new FormData();
        formData.append("image", file);
        formData.append("filename", `user-avatar-${Date.now()}`);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Failed to upload image to hosting API.");
        }

        setImageUrl(data.url);
        onImageUploaded?.(data.url);

        // If autoSave is enabled, also trigger the update action if available
        if (autoSave) {
          const updateForm = new FormData();
          updateForm.append("imageUrl", data.url);
          const updateRes = await fetch("/api/user/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageUrl: data.url }),
          });
          if (!updateRes.ok) {
            console.warn("Could not auto-save avatar to user profile");
          }
        }
      }

      setSuccessMessage("Photo uploaded successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while uploading the photo.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    setError(null);
    setSuccessMessage(null);
    setIsRemoving(true);

    try {
      if (removeAction) {
        const result = await removeAction();
        if (result && !result.ok) {
          throw new Error(result.message || "Failed to remove image.");
        }
      } else if (autoSave) {
        const res = await fetch("/api/user/image", {
          method: "DELETE",
        });
        if (!res.ok) {
          throw new Error("Failed to remove image.");
        }
      }

      setImageUrl(null);
      onImageUploaded?.(null);
      setSuccessMessage("Profile photo removed.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to remove photo.");
    } finally {
      setIsRemoving(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium text-slate-800">{label}</label>
          {subLabel && (
            <p className="text-xs text-slate-500">{subLabel}</p>
          )}
        </div>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col sm:flex-row items-center gap-5 rounded-2xl border p-4 transition ${
          isDragging
            ? "border-emerald-500 bg-emerald-50/50"
            : "border-slate-200 bg-slate-50/60"
        }`}
      >
        {/* Avatar Display */}
        <div className="relative group">
          <UserAvatar
            src={imageUrl}
            name={userName}
            size="xl"
            className="ring-4 ring-white shadow-sm"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading || isRemoving}
            title="Change photo"
            className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white shadow-md transition hover:bg-slate-800 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex-1 space-y-2 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isRemoving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-white border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-400 disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Uploading to server...
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  Upload new photo
                </>
              )}
            </button>

            {imageUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading || isRemoving}
                className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50/60 px-3.5 py-2 text-xs font-medium text-rose-700 transition hover:bg-rose-100/70 disabled:opacity-50"
              >
                {isRemoving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                Remove photo
              </button>
            )}
          </div>

          <p className="text-[11px] text-slate-500">
            Drag & drop an image here or click upload.
          </p>

          {successMessage && (
            <div className="flex items-center gap-1 text-xs font-medium text-emerald-700">
              <Check className="h-3.5 w-3.5" />
              {successMessage}
            </div>
          )}

          {error && (
            <p className="text-xs font-medium text-rose-600">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
