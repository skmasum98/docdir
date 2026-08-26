"use client";

import Image from "next/image";
import { User as UserIcon } from "lucide-react";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function UserAvatar({
  src,
  name,
  size = "md",
  className = "",
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

  if (src) {
    return (
      <div
        className={`relative overflow-hidden rounded-full border border-slate-200 bg-slate-100 flex-shrink-0 ${sizeClasses[size]} ${className}`}
      >
        <Image
          src={src}
          alt={name || "User Avatar"}
          width={pixelDimensions[size]}
          height={pixelDimensions[size]}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
          unoptimized={false}
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
