"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { User as UserIcon } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fallbackSrc?: string | null;
}

export function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
  fallbackSrc = "/Dotor-Avatar.webp",
}: UserAvatarProps) {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-24 h-24 text-xl",
  };

  const pixelDimensions = {
    sm: 32,
    md: 40,
    lg: 64,
    xl: 96,
  };

  const initials = name
    ? name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  const [imgError, setImgError] = useState(false);
  const [fallbackFailed, setFallbackFailed] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [src]);

  useEffect(() => {
    setFallbackFailed(false);
  }, [fallbackSrc]);

  const cleanSrc = src?.trim() ? src.trim() : null;
  const cleanFallback = fallbackSrc?.trim() ? fallbackSrc.trim() : null;
  const effectiveSrc =
    !cleanSrc || imgError ? (fallbackFailed ? null : cleanFallback) : cleanSrc;

  if (effectiveSrc) {
    return (
      <div
        className={`relative overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex-shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <Image
          src={effectiveSrc}
          alt={name || "User Avatar"}
          width={pixelDimensions[size]}
          height={pixelDimensions[size]}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          unoptimized={false}
          onError={() => {
            if (effectiveSrc === cleanFallback) {
              setFallbackFailed(true);
            } else {
              setImgError(true);
            }
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-700 flex-shrink-0 border border-slate-300/60 ${sizeClasses[size]} ${className}`}
    >
      {initials ? initials : <UserIcon className="h-1/2 w-1/2 text-slate-500" />}
    </div>
  );
}
