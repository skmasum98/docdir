"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Building2,
  Hospital,
  FlaskConical,
  Stethoscope,
  Pill,
  Home,
} from "lucide-react";

interface FacilityLogoProps {
  src?: string | null;
  name?: string | null;
  type?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
  shape?: "rounded" | "circle" | "square";
  className?: string;
}

export function FacilityLogo({
  src,
  name,
  type = "HOSPITAL",
  size = "md",
  shape = "rounded",
  className = "",
}: FacilityLogoProps) {
  const [hasError, setHasError] = useState(false);

  const sizeClasses = {
    xs: "w-6 h-6 text-[10px]",
    sm: "w-9 h-9 text-xs",
    md: "w-12 h-12 text-sm",
    lg: "w-16 h-16 text-base",
    xl: "w-20 h-20 text-lg",
    "2xl": "w-24 h-24 text-xl",
  };

  const pixelDimensions = {
    xs: 24,
    sm: 36,
    md: 48,
    lg: 64,
    xl: 80,
    "2xl": 96,
  };

  const shapeClasses = {
    rounded: "rounded-2xl",
    circle: "rounded-full",
    square: "rounded-xl",
  };

  const iconSizes = {
    xs: "h-3 w-3",
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-7 w-7",
    xl: "h-9 w-9",
    "2xl": "h-11 w-11",
  };

  const typeConfig: Record<
    string,
    { bg: string; text: string; border: string; icon: any }
  > = {
    HOSPITAL: {
      bg: "bg-blue-50",
      text: "text-blue-700",
      border: "border-blue-200/80",
      icon: Hospital,
    },
    DIAGNOSTIC: {
      bg: "bg-teal-50",
      text: "text-teal-700",
      border: "border-teal-200/80",
      icon: FlaskConical,
    },
    CLINIC: {
      bg: "bg-amber-50",
      text: "text-amber-700",
      border: "border-amber-200/80",
      icon: Stethoscope,
    },
    PHARMACY: {
      bg: "bg-emerald-50",
      text: "text-emerald-700",
      border: "border-emerald-200/80",
      icon: Pill,
    },
    CHAMBER: {
      bg: "bg-purple-50",
      text: "text-purple-700",
      border: "border-purple-200/80",
      icon: Home,
    },
  };

  const currentConfig = (type && typeConfig[type]) || {
    bg: "bg-slate-100",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Building2,
  };

  const Icon = currentConfig.icon;

  const initials = name
    ? name
        .split(" ")
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "";

  if (src && !hasError) {
    return (
      <div
        className={`relative overflow-hidden border border-slate-200/80 bg-white flex-shrink-0 flex items-center justify-center p-1 ${shapeClasses[shape]} ${sizeClasses[size]} ${className}`}
      >
        <Image
          src={src}
          alt={name || "Institute Logo"}
          width={pixelDimensions[size]}
          height={pixelDimensions[size]}
          className="h-full w-full object-contain"
          referrerPolicy="no-referrer"
          unoptimized
          onError={() => setHasError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex items-center justify-center font-bold flex-shrink-0 border ${currentConfig.bg} ${currentConfig.text} ${currentConfig.border} ${shapeClasses[shape]} ${sizeClasses[size]} ${className}`}
    >
      {initials ? (
        <span className="leading-none select-none tracking-tight">{initials}</span>
      ) : (
        <Icon className={iconSizes[size]} />
      )}
    </div>
  );
}
