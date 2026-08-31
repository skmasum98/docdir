import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import ReviewForm from "./review-form";
import { UserAvatar } from "@/components/user-avatar";
import { DoctorShareButton } from "@/components/doctor-share-button";
import { DoctorClaimBanner } from "@/components/doctor-claim-banner";
import { FacilityLogo } from "@/components/facility-logo";
import BookingModal from "@/components/booking-modal";

import {
  Stethoscope,
  Clock,
  Phone,
  MapPin,
  Award,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Building2,
  Globe,
  Mail,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  BookOpen,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type Props = {
  params: Promise<{ slug: string }>;
};

/* =========================================================
   METADATA
========================================================= */

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;

  const doctor = await prisma.doctor.findUnique({
    where: { slug },
    include: { specialty: true },
  });

  if (!doctor || doctor.status === "BLOCKED") {
    return {
      title: "Doctor Not Found | Doctor Directory",
    };
  }

  const specialtyName =
    doctor.specialty?.name || "Specialist Doctor";

  const location =
    [doctor.area, doctor.city].filter(Boolean).join(", ") ||
    "Bangladesh";

  const title = `${doctor.fullName} - ${specialtyName} in ${location} | Chamber, Visiting Hours & Fees`;

  const description = `${doctor.fullName} (${doctor.degrees || specialtyName})${
    doctor.designation ? ` - ${doctor.designation}` : ""
  }. Practicing at ${
    doctor.hospitalName ||
    doctor.chamberAddress ||
    location
  }. Visiting hours: ${
    doctor.visitingHours || "Contact for schedule"
  }. Consultation Fee: ৳${
    doctor.consultationFee || "N/A"
  }. BMDC Reg: ${doctor.bmdcNumber || "Verified"}.`;

  const siteUrl =
    process.env.NEXTAUTH_URL ||
    "https://doctordirectory.com";

  const pageUrl =
    `${siteUrl}/doctor/${doctor.slug}`;

  return {
    title,
    description,

    keywords: [
      doctor.fullName,
      specialtyName,
      `${specialtyName} doctor in ${doctor.city || "Dhaka"}`,
      `${specialtyName} in ${doctor.area || "Bangladesh"}`,
      `Dr. ${doctor.fullName} chamber address`,
      `Dr. ${doctor.fullName} visiting hours`,
      `Dr. ${doctor.fullName} appointment phone serial`,
      doctor.bmdcNumber
        ? `BMDC ${doctor.bmdcNumber}`
        : "",
      doctor.hospitalName || "",
      "Best doctors in Bangladesh",
    ].filter(Boolean),

    alternates: {
      canonical: pageUrl,
    },

    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: "Doctor Directory",
      type: "profile",

      images: doctor.profilePhoto
        ? [
            {
              url: doctor.profilePhoto,
              width: 800,
              height: 800,
              alt: `${doctor.fullName} - ${specialtyName}`,
            },
          ]
        : [],
    },

    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: doctor.profilePhoto
        ? [doctor.profilePhoto]
        : [],
    },
  };
}

/* =========================================================
   PAGE
========================================================= */

export default async function DoctorPage({
  params,
}: Props) {
  const { slug } = await params;

  const session = await auth();

  const doctor = await prisma.doctor.findUnique({
    where: { slug },

    include: {
      specialty: true,

      blogs: {
        where: {
          status: "PUBLISHED",
        },

        orderBy: {
          publishedAt: "desc",
        },

        take: 4,

        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          publishedAt: true,
        },
      },

      doctorFacilities: {
        include: {
          facility: {
            include: {
              upazila: {
                include: {
                  district: {
                    include: {
                      division: true,
                    },
                  },
                },
              },
            },
          },
        },
      },

      reviews: {
        where: {
          isApproved: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        include: {
          user: {
            select: {
              name: true,
              image: true,
            },
          },
        },
      },
    },
  });

  if (
    !doctor ||
    doctor.status === "BLOCKED"
  ) {
    notFound();
  }

  /* =========================================================
     DERIVED DATA
  ========================================================= */

  const avgRating =
    doctor.reviews.length > 0
      ? doctor.reviews.reduce(
          (sum, review) =>
            sum + review.rating,
          0
        ) / doctor.reviews.length
      : null;

  const isOwnProfile =
    session?.user &&
    doctor.userId !== null &&
    Number(session.user.id) === doctor.userId;

  const servicesList = doctor.services
    ? doctor.services
        .split(/[,;\n]/)
        .map((service) => service.trim())
        .filter(Boolean)
    : [];

  const degreesList = doctor.degrees
    ? doctor.degrees
        .split(/[,;]/)
        .map((degree) => degree.trim())
        .filter(Boolean)
    : [];

  const appointmentPhone =
    doctor.appointmentPhone ||
    doctor.phone;

  const cleanPhoneForDial =
    appointmentPhone?.replace(
      /[^0-9+]/g,
      ""
    );

  /* =========================================================
     FAQ
  ========================================================= */

  const faqItems = [
    {
      question: `What are the consultation fees for ${doctor.fullName}?`,

      answer: doctor.consultationFee
        ? `The new patient consultation fee for ${doctor.fullName} is ৳${doctor.consultationFee}.${
            doctor.followUpFee
              ? ` Follow-up consultation fee is ৳${doctor.followUpFee}.`
              : ""
          }`
        : `Please call ${
            appointmentPhone || "the chamber"
          } for current consultation and follow-up fees.`,
    },

    {
      question: `What is the visiting schedule and chamber location for ${doctor.fullName}?`,

      answer: `${doctor.fullName} practices at ${
        doctor.hospitalName || "Chamber"
      }${
        doctor.chamberAddress
          ? `, ${doctor.chamberAddress}`
          : ""
      }${
        doctor.city
          ? `, ${doctor.city}`
          : ""
      }. Visiting hours are: ${
        doctor.visitingHours ||
        "by prior appointment"
      }.`,
    },

    {
      question: `How do I book an appointment or serial with ${doctor.fullName}?`,

      answer: appointmentPhone
        ? `You can book an appointment directly by calling the appointment serial hotline at ${appointmentPhone}. Early booking is recommended.`
        : `Appointments can be scheduled by contacting the hospital reception or visiting the chamber during working hours.`,
    },

    {
      question: `What medical qualifications and experience does ${doctor.fullName} have?`,

      answer: `${doctor.fullName} has qualifications including ${
        doctor.degrees ||
        doctor.specialty?.name ||
        "Medical degree"
      }${
        doctor.experienceYears
          ? ` with over ${doctor.experienceYears} years of clinical experience`
          : ""
      }${
        doctor.bmdcNumber
          ? ` and is registered under BMDC Reg No. ${doctor.bmdcNumber}`
          : ""
      }.`,
    },
  ];

  /* =========================================================
     JSON-LD
  ========================================================= */

  const siteUrl =
    process.env.NEXTAUTH_URL ||
    "https://doctordirectory.com";

  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": [
      "Physician",
      "MedicalBusiness",
    ],

    name: doctor.fullName,

    description:
      doctor.about ||
      `${doctor.fullName} - ${
        doctor.specialty?.name ||
        "Doctor"
      }`,

    image:
      doctor.profilePhoto || undefined,

    url:
      `${siteUrl}/doctor/${doctor.slug}`,

    telephone:
      appointmentPhone || undefined,

    email:
      doctor.email || undefined,

    medicalSpecialty:
      doctor.specialty?.name
        ? `https://schema.org/${doctor.specialty.name.replace(
            /\s+/g,
            ""
          )}`
        : "GeneralMedicine",

    priceRange:
      doctor.consultationFee
        ? `৳${doctor.consultationFee}`
        : "৳৳",

    hasCredential: [
      doctor.degrees
        ? {
            "@type":
              "EducationalOccupationalCredential",
            credentialCategory: "degree",
            name: doctor.degrees,
          }
        : null,

      doctor.bmdcNumber
        ? {
            "@type":
              "EducationalOccupationalCredential",
            credentialCategory:
              "medicalLicense",
            name: `BMDC Reg ${doctor.bmdcNumber}`,
          }
        : null,
    ].filter(Boolean),

    address: {
      "@type": "PostalAddress",
      streetAddress:
        doctor.chamberAddress ||
        doctor.hospitalName ||
        "",
      addressLocality:
        doctor.city || "Dhaka",
      addressRegion:
        doctor.area || "",
      addressCountry: "BD",
    },

    isAcceptingNewPatients: true,

    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue:
          avgRating.toFixed(1),
        reviewCount:
          doctor.reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
    }),

    ...(servicesList.length > 0 && {
      availableService:
        servicesList.map((service) => ({
          "@type": "MedicalProcedure",
          name: service,
        })),
    }),
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",

    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${siteUrl}/`,
      },

      {
        "@type": "ListItem",
        position: 2,
        name:
          doctor.specialty?.name ||
          "Doctors",
        item:
          `${siteUrl}/search?specialtyId=${
            doctor.specialtyId || ""
          }`,
      },

      {
        "@type": "ListItem",
        position: 3,
        name: doctor.fullName,
        item:
          `${siteUrl}/doctor/${doctor.slug}`,
      },
    ],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",

    mainEntity: faqItems.map(
      (item) => ({
        "@type": "Question",
        name: item.question,

        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })
    ),
  };

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-50 pb-12 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:pb-16">

      {/* =====================================================
          STRUCTURED DATA
      ===================================================== */}

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              physicianSchema
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(
              breadcrumbSchema
            ),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html:
            JSON.stringify(faqSchema),
        }}
      />

      {/* =====================================================
          BREADCRUMB
      ===================================================== */}

      <div className="border-b border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav
            className="flex min-w-0 items-center gap-1.5 overflow-x-auto whitespace-nowrap py-3 text-xs text-slate-500 scrollbar-hide dark:text-slate-400"
            aria-label="Breadcrumb"
          >
            <Link
              href="/"
              className="shrink-0 transition hover:text-slate-900 dark:hover:text-white"
            >
              Home
            </Link>

            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />

            <Link
              href="/search"
              className="shrink-0 transition hover:text-slate-900 dark:hover:text-white"
            >
              Find Doctors
            </Link>

            {doctor.specialty && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />

                <Link
                  href={`/search?specialty=${doctor.specialty.slug}`}
                  className="max-w-[140px] shrink-0 truncate transition hover:text-slate-900 dark:hover:text-white sm:max-w-none"
                >
                  {doctor.specialty.name}
                </Link>
              </>
            )}

            <ChevronRight className="h-3 w-3 shrink-0 text-slate-400" />

            <span className="max-w-[160px] truncate font-medium text-slate-900 dark:text-slate-100 sm:max-w-[240px]">
              {doctor.fullName}
            </span>
          </nav>
        </div>
      </div>

      {/* =====================================================
          PAGE CONTAINER
      ===================================================== */}

      <div className="mx-auto max-w-6xl space-y-5 px-4 pt-4 sm:space-y-6 sm:px-6 sm:pt-6">

        {/* ===================================================
            CLAIM BANNER
        =================================================== */}

        {!doctor.profileClaimed &&
          !isOwnProfile && (
            <DoctorClaimBanner
              doctorId={doctor.id}
              doctorName={doctor.fullName}
            />
          )}

        {/* ===================================================
            HERO CARD
        =================================================== */}

        <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-8">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between lg:gap-8">

            {/* Doctor identity */}

            <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:gap-6">

              {/* Avatar */}

              <div className="relative mx-auto shrink-0 sm:mx-0">
                <UserAvatar
                  src={doctor.profilePhoto}
                  name={doctor.fullName}
                  size="xl"
                  className="h-24 w-24 rounded-2xl object-cover shadow-md ring-4 ring-slate-100 dark:ring-slate-800 sm:h-32 sm:w-32"
                />

                {doctor.isVerified && (
                  <span
                    className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white dark:ring-slate-900 sm:text-[11px]"
                    title="BMDC Verified Medical Practitioner"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>

              {/* Identity content */}

              <div className="min-w-0 flex-1 space-y-2 text-center sm:text-left">

                <h1 className="break-words text-xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-2xl lg:text-3xl">
                  {doctor.fullName}
                </h1>

                {doctor.degrees && (
                  <p className="break-words text-sm font-medium leading-snug text-indigo-900 dark:text-indigo-300">
                    {doctor.degrees}
                  </p>
                )}

                <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">

                  {doctor.designation && (
                    <p className="break-words font-medium text-slate-800 dark:text-slate-200">
                      {doctor.designation}
                    </p>
                  )}

                  {doctor.hospitalName && (
                    <p className="flex items-start justify-center gap-1.5 break-words text-slate-600 dark:text-slate-300 sm:justify-start">
                      <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                      <span className="min-w-0">
                        {doctor.hospitalName}
                      </span>
                    </p>
                  )}
                </div>

                {/* Badges */}

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 sm:justify-start">

                  {doctor.specialty && (
                    <span className="inline-flex max-w-full items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                      <Stethoscope className="h-3.5 w-3.5 shrink-0" />

                      <span className="truncate">
                        {doctor.specialty.name}
                      </span>
                    </span>
                  )}

                  {doctor.experienceYears !== null &&
                    doctor.experienceYears > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                        <Award className="h-3.5 w-3.5 text-slate-500" />
                        {doctor.experienceYears}+ Years
                      </span>
                    )}

                  {doctor.bmdcNumber && (
                    <span className="inline-flex max-w-full items-center rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                      <span className="truncate">
                        BMDC: {doctor.bmdcNumber}
                      </span>
                    </span>
                  )}
                </div>

                {/* Rating */}

                {avgRating !== null ? (
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-sm sm:justify-start">

                    <div
                      className="flex items-center text-amber-500"
                      aria-label={`Rated ${avgRating.toFixed(
                        1
                      )} out of 5`}
                    >
                      {"★".repeat(
                        Math.round(avgRating)
                      )}

                      {"☆".repeat(
                        5 -
                          Math.round(
                            avgRating
                          )
                      )}
                    </div>

                    <span className="font-semibold text-slate-900 dark:text-white">
                      {avgRating.toFixed(1)}
                    </span>

                    <span className="text-slate-500 dark:text-slate-400">
                      ({doctor.reviews.length}{" "}
                      review
                      {doctor.reviews.length ===
                      1
                        ? ""
                        : "s"}
                      )
                    </span>
                  </div>
                ) : (
                  <p className="pt-1 text-xs text-slate-400">
                    Verified Medical Profile
                  </p>
                )}
              </div>
            </div>

            {/* =================================================
                ACTION / FEE CARD
            ================================================= */}

            <div className="w-full shrink-0 rounded-2xl border border-slate-200/80 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/70 sm:p-5 lg:w-72">

              <div className="flex items-end justify-between gap-3 border-b border-slate-200 pb-3 dark:border-slate-700">

                <div className="min-w-0">
                  <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                    New Patient Fee
                  </span>

                  <p className="mt-0.5 break-words text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                    {doctor.consultationFee
                      ? `৳${doctor.consultationFee}`
                      : "Call for info"}
                  </p>
                </div>

                {doctor.followUpFee && (
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
                      Follow-up
                    </span>

                    <p className="text-base font-semibold text-slate-700 dark:text-slate-200 sm:text-lg">
                      ৳{doctor.followUpFee}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2">

                <BookingModal
                  doctorId={doctor.id}
                  doctorName={doctor.fullName}
                  specialty={
                    doctor.specialty?.name ||
                    null
                  }
                  consultationFee={
                    doctor.consultationFee
                  }
                  userLoggedIn={Boolean(
                    session?.user
                  )}
                  userName={
                    session?.user?.name ||
                    undefined
                  }
                  userEmail={
                    session?.user?.email ||
                    undefined
                  }
                  userPhone={
                    (session?.user as any)
                      ?.phone || undefined
                  }
                  hospitalName={
                    doctor.hospitalName ||
                    undefined
                  }
                  chamberAddress={
                    doctor.chamberAddress ||
                    undefined
                  }
                  city={
                    doctor.city || undefined
                  }
                  area={
                    doctor.area || undefined
                  }
                  appointmentPhone={
                    appointmentPhone ||
                    undefined
                  }
                />

                {appointmentPhone && (
                  <a
                    href={`tel:${cleanPhoneForDial}`}
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-3 py-2.5 text-center text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
                  >
                    <Phone className="h-4 w-4 shrink-0" />

                    <span className="truncate">
                      Or Call: {appointmentPhone}
                    </span>
                  </a>
                )}

                {appointmentPhone && (
                  <a
                    href={`https://wa.me/${cleanPhoneForDial?.replace(
                      "+",
                      ""
                    )}?text=Hello,%20I%20would%20like%20to%20book%20a%20doctor%20appointment%20serial%20for%20${encodeURIComponent(
                      doctor.fullName
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-h-10 w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-3 py-2.5 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70"
                  >
                    <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600" />
                    WhatsApp Booking
                  </a>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-4">

                <DoctorShareButton
                  doctorName={
                    doctor.fullName
                  }
                  specialty={
                    doctor.specialty?.name
                  }
                />

                {isOwnProfile && (
                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ===================================================
            MAIN CONTENT
        =================================================== */}

        <div className="grid min-w-0 gap-5 lg:grid-cols-3 lg:gap-6">

          {/* =================================================
              LEFT / MAIN COLUMN
          ================================================= */}

          <div className="min-w-0 space-y-5 lg:col-span-2 lg:space-y-6">

            {/* =================================================
                CHAMBER
            ================================================= */}

            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">

                <div className="flex min-w-0 items-center gap-2.5">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                    <Clock className="h-5 w-5" />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                      Chamber & Visiting Schedule
                    </h2>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Consultation timings and room info
                    </p>
                  </div>
                </div>

                {appointmentPhone && (
                  <span className="hidden shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 sm:inline-flex">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Active
                  </span>
                )}
              </div>

              <div className="space-y-4 pt-4">

                {doctor.visitingHours && (
                  <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30">
                    <div className="flex items-start gap-3">

                      <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-indigo-600 dark:text-indigo-400" />

                      <div className="min-w-0">
                        <span className="text-xs font-semibold uppercase tracking-wide text-indigo-900 dark:text-indigo-300">
                          Visiting Days & Hours
                        </span>

                        <p className="mt-0.5 break-words text-sm font-semibold text-slate-900 dark:text-white">
                          {doctor.visitingHours}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid gap-4 sm:grid-cols-2">

                  {doctor.hospitalName && (
                    <div className="min-w-0 space-y-1">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Hospital / Diagnostic Center
                      </span>

                      <p className="break-words text-sm font-semibold text-slate-900 dark:text-white">
                        {doctor.hospitalName}
                      </p>
                    </div>
                  )}

                  {doctor.chamberAddress && (
                    <div className="min-w-0 space-y-1 sm:col-span-2">
                      <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        Chamber Location & Room
                      </span>

                      <p className="break-words whitespace-pre-line text-sm text-slate-800 dark:text-slate-200">
                        {doctor.chamberAddress}
                      </p>

                      {doctor.city && (
                        <p className="break-words text-xs text-slate-500 dark:text-slate-400">
                          Location:{" "}
                          {[
                            doctor.area,
                            doctor.city,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {doctor.chamberAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${doctor.hospitalName || ""} ${
                        doctor.chamberAddress
                      } ${doctor.city || ""}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex max-w-full items-center gap-1.5 text-xs font-semibold text-indigo-700 transition hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <span className="truncate">
                      Open in Google Maps
                    </span>

                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                )}
              </div>
            </section>

            {/* =================================================
                SERVICES
            ================================================= */}

            {servicesList.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

                <SectionHeading
                  icon={
                    <Sparkles className="h-5 w-5" />
                  }
                  iconClass="bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                  title="Conditions Treated & Medical Services"
                  description="Areas of clinical focus and procedures"
                />

                <div className="flex flex-wrap gap-2 pt-4">
                  {servicesList.map(
                    (service, index) => (
                      <span
                        key={index}
                        className="max-w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-indigo-800 dark:hover:bg-indigo-950/40 dark:hover:text-indigo-300"
                      >
                        {service}
                      </span>
                    )
                  )}
                </div>
              </section>
            )}

            {/* =================================================
                ABOUT
            ================================================= */}

            {doctor.about && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

                <SectionHeading
                  icon={
                    <Award className="h-5 w-5" />
                  }
                  iconClass="bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
                  title="About the Doctor"
                  description="Professional background & care philosophy"
                />

                <p className="whitespace-pre-line break-words pt-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                  {doctor.about}
                </p>
              </section>
            )}

            {/* =================================================
                FACILITIES
            ================================================= */}

            {doctor.doctorFacilities.length >
              0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

                <SectionHeading
                  icon={
                    <Building2 className="h-5 w-5" />
                  }
                  iconClass="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  title="Practices & Hospital Attachments"
                  description="Hospitals and diagnostic centers affiliated with this doctor"
                />

                <div className="grid gap-3 pt-4 sm:grid-cols-2">

                  {doctor.doctorFacilities.map(
                    (df) => (
                      <div
                        key={df.id}
                        className="flex min-w-0 items-start gap-3 rounded-2xl border border-slate-200 p-3.5 transition hover:border-indigo-200 dark:border-slate-700 dark:hover:border-indigo-800 sm:p-4"
                      >
                        <FacilityLogo
                          src={
                            df.facility.logo
                          }
                          name={
                            df.facility.name
                          }
                          type={
                            df.facility.type
                          }
                          size="md"
                          shape="rounded"
                          className="mt-0.5 shrink-0 shadow-2xs"
                        />

                        <div className="min-w-0 flex-1">

                          <Link
                            href={`/facility/${df.facility.slug}`}
                            className="flex items-center justify-between gap-1 text-sm font-semibold text-slate-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-400"
                          >
                            <span className="min-w-0 truncate">
                              {df.facility.name}
                            </span>

                            <ExternalLink className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                          </Link>

                          <p className="mt-1 break-words text-xs font-medium text-slate-500 dark:text-slate-400">
                            {df.facility.type}

                            {df.facility.upazila &&
                              ` · ${df.facility.upazila.name}${
                                df.facility.upazila.district?.name
                                  ? `, ${df.facility.upazila.district.name}`
                                  : ""
                              }`}
                          </p>

                          {df.facility.address && (
                            <p className="mt-1 break-words text-xs text-slate-600 dark:text-slate-400">
                              {df.facility.address}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            )}

            {/* =================================================
                BLOGS
            ================================================= */}

            {doctor.blogs &&
              doctor.blogs.length > 0 && (
                <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

                  <SectionHeading
                    icon={
                      <BookOpen className="h-5 w-5" />
                    }
                    iconClass="bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                    title={`Health Articles by ${doctor.fullName}`}
                    description="Medical advice and health guidance"
                  />

                  <div className="grid gap-3 pt-4 sm:grid-cols-2">

                    {doctor.blogs.map(
                      (blog) => (
                        <Link
                          key={blog.id}
                          href={`/blog/${blog.slug}`}
                          className="block min-w-0 rounded-2xl border border-slate-200 p-4 transition hover:border-purple-300 hover:bg-purple-50/30 dark:border-slate-700 dark:hover:border-purple-800 dark:hover:bg-purple-950/20"
                        >
                          <h3 className="line-clamp-2 break-words text-sm font-semibold text-slate-900 dark:text-white">
                            {blog.title}
                          </h3>

                          {blog.excerpt && (
                            <p className="mt-1 line-clamp-2 break-words text-xs text-slate-600 dark:text-slate-400">
                              {blog.excerpt}
                            </p>
                          )}

                          {blog.publishedAt && (
                            <p className="pt-2 text-[11px] text-slate-400">
                              {new Date(
                                blog.publishedAt
                              ).toLocaleDateString()}
                            </p>
                          )}
                        </Link>
                      )
                    )}
                  </div>
                </section>
              )}

            {/* =================================================
                FAQ
            ================================================= */}

            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

              <SectionHeading
                icon={
                  <HelpCircle className="h-5 w-5" />
                }
                iconClass="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                title="Frequently Asked Questions"
                description="Common questions about appointments and chamber visits"
              />

              <div className="space-y-3 pt-4">

                {faqItems.map(
                  (faq, index) => (
                    <details
                      key={index}
                      className="group rounded-2xl border border-slate-200 bg-slate-50/60 p-3.5 transition open:bg-white open:ring-1 open:ring-slate-200 dark:border-slate-700 dark:bg-slate-800/50 dark:open:bg-slate-900 dark:open:ring-slate-700 sm:p-4"
                    >
                      <summary className="flex cursor-pointer list-none items-start justify-between gap-3 text-sm font-semibold text-slate-900 dark:text-white">
                        <span className="min-w-0 break-words">
                          {faq.question}
                        </span>

                        <span className="shrink-0 text-slate-400 transition-transform group-open:rotate-180">
                          ▼
                        </span>
                      </summary>

                      <p className="mt-3 break-words text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                        {faq.answer}
                      </p>
                    </details>
                  )
                )}
              </div>
            </section>

            {/* =================================================
                REVIEWS
            ================================================= */}

            <section className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6 lg:p-7">

              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 dark:border-slate-800">

                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
                    Patient Reviews
                  </h2>

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified feedback from consulted patients
                  </p>
                </div>

                {avgRating !== null && (
                  <div className="shrink-0 text-right">
                    <span className="text-xl font-bold text-slate-900 dark:text-white">
                      {avgRating.toFixed(1)}
                    </span>

                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {" "}
                      / 5.0
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-4 pt-4">

                {doctor.reviews.length ===
                0 ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400 sm:p-6">
                    No verified patient reviews yet.
                    Be the first to leave a review!
                  </div>
                ) : (
                  doctor.reviews.map(
                    (review) => (
                      <div
                        key={review.id}
                        className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs dark:border-slate-700 dark:bg-slate-900 sm:p-4"
                      >
                        <div className="flex items-start justify-between gap-3">

                          <div className="flex min-w-0 items-center gap-2">

                            <UserAvatar
                              src={
                                review.user
                                  .image
                              }
                              name={
                                review.user
                                  .name
                              }
                              size="sm"
                            />

                            <p className="min-w-0 truncate text-sm font-semibold text-slate-900 dark:text-white">
                              {
                                review.user
                                  .name
                              }
                            </p>
                          </div>

                          <div
                            className="shrink-0 text-sm text-amber-500"
                            aria-label={`${review.rating} stars`}
                          >
                            {"★".repeat(
                              review.rating
                            )}
                          </div>
                        </div>

                        {review.comment && (
                          <p className="break-words pt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300 sm:pl-10">
                            {review.comment}
                          </p>
                        )}

                        <p className="pt-1 text-[11px] text-slate-400 sm:pl-10">
                          {review.createdAt.toLocaleDateString(
                            undefined,
                            {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            }
                          )}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>

              <div className="pt-5">
                <ReviewForm
                  doctorId={doctor.id}
                  loggedIn={
                    Boolean(session?.user) &&
                    !isOwnProfile
                  }
                />
              </div>
            </section>
          </div>

          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside className="min-w-0 space-y-5 lg:space-y-6">

            {/* =================================================
                CONTACT
            ================================================= */}

            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">

              <h3 className="border-b border-slate-100 pb-2.5 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                Contact Details
              </h3>

              <ul className="space-y-4 pt-4 text-sm">

                {appointmentPhone && (
                  <li className="min-w-0">

                    <span className="block text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs">
                      Appointment Serial
                    </span>

                    <a
                      href={`tel:${cleanPhoneForDial}`}
                      className="mt-0.5 flex min-w-0 items-center gap-1.5 break-words font-semibold text-indigo-700 hover:underline dark:text-indigo-400"
                    >
                      <Phone className="h-3.5 w-3.5 shrink-0" />

                      <span className="break-all">
                        {appointmentPhone}
                      </span>
                    </a>
                  </li>
                )}

                {doctor.phone &&
                  doctor.phone !==
                    appointmentPhone && (
                    <li>
                      <span className="block text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs">
                        Direct Phone
                      </span>

                      <a
                        href={`tel:${doctor.phone.replace(
                          /[^0-9+]/g,
                          ""
                        )}`}
                        className="break-all font-medium text-slate-800 hover:underline dark:text-slate-200"
                      >
                        {doctor.phone}
                      </a>
                    </li>
                  )}

                {doctor.email && (
                  <li className="min-w-0">

                    <span className="block text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs">
                      Email
                    </span>

                    <a
                      href={`mailto:${doctor.email}`}
                      className="mt-0.5 flex min-w-0 items-start gap-1.5 break-all text-slate-800 hover:text-indigo-700 hover:underline dark:text-slate-200 dark:hover:text-indigo-400"
                    >
                      <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />

                      <span>
                        {doctor.email}
                      </span>
                    </a>
                  </li>
                )}

                {doctor.website && (
                  <li className="min-w-0">

                    <span className="block text-[10px] uppercase tracking-wide text-slate-400 sm:text-xs">
                      Website
                    </span>

                    <a
                      href={
                        doctor.website
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="mt-0.5 flex min-w-0 items-start gap-1.5 break-all text-xs text-indigo-700 hover:underline dark:text-indigo-400"
                    >
                      <Globe className="mt-0.5 h-3.5 w-3.5 shrink-0" />

                      <span>
                        {doctor.website}
                      </span>
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* =================================================
                CREDENTIALS
            ================================================= */}

            <div className="rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-6">

              <h3 className="border-b border-slate-100 pb-2.5 text-base font-semibold text-slate-900 dark:border-slate-800 dark:text-white">
                Medical Credentials
              </h3>

              <dl className="space-y-3 pt-4 text-xs">

                <div>
                  <dt className="font-medium uppercase tracking-wide text-slate-400">
                    BMDC Status
                  </dt>

                  <dd className="mt-0.5 flex items-center gap-1 font-semibold text-slate-900 dark:text-white">

                    {doctor.isVerified ? (
                      <>
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        Verified Registration
                      </>
                    ) : (
                      "Listed Medical Professional"
                    )}
                  </dd>
                </div>

                {doctor.bmdcNumber && (
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-slate-400">
                      BMDC Number
                    </dt>

                    <dd className="mt-0.5 break-all font-mono text-slate-800 dark:text-slate-200">
                      {doctor.bmdcNumber}
                    </dd>
                  </div>
                )}

                {doctor.gender && (
                  <div>
                    <dt className="font-medium uppercase tracking-wide text-slate-400">
                      Gender
                    </dt>

                    <dd className="mt-0.5 capitalize text-slate-800 dark:text-slate-200">
                      {doctor.gender.toLowerCase()}
                    </dd>
                  </div>
                )}

                {doctor.experienceYears !==
                  null &&
                  doctor.experienceYears >
                    0 && (
                    <div>
                      <dt className="font-medium uppercase tracking-wide text-slate-400">
                        Experience
                      </dt>

                      <dd className="mt-0.5 text-slate-800 dark:text-slate-200">
                        {doctor.experienceYears}{" "}
                        Years
                      </dd>
                    </div>
                  )}
              </dl>
            </div>

            {/* =================================================
                RELATED DOCTORS
            ================================================= */}

            {doctor.specialty && (
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 sm:p-6">

                <h3 className="text-sm font-semibold text-indigo-950 dark:text-indigo-200">
                  Looking for more{" "}
                  {doctor.specialty.name}{" "}
                  specialists?
                </h3>

                <p className="mt-2 text-xs leading-relaxed text-indigo-900/80 dark:text-indigo-300/80">
                  Browse our directory of verified{" "}
                  {doctor.specialty.name.toLowerCase()}{" "}
                  specialists across{" "}
                  {doctor.city ||
                    "Bangladesh"}
                  .
                </p>

                <Link
                  href={`/search?specialty=${doctor.specialty.slug}${
                    doctor.city
                      ? `&q=${encodeURIComponent(
                          doctor.city
                        )}`
                      : ""
                  }`}
                  className="mt-3 inline-flex max-w-full items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700"
                >
                  <span className="truncate">
                    View{" "}
                    {
                      doctor.specialty
                        .name
                    }{" "}
                    Doctors
                  </span>

                  <ChevronRight className="h-3 w-3 shrink-0" />
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   REUSABLE SECTION HEADING
========================================================= */

function SectionHeading({
  icon,
  iconClass,
  title,
  description,
}: {
  icon: React.ReactNode;
  iconClass: string;
  title: string;
  description: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2.5 border-b border-slate-100 pb-3 dark:border-slate-800">

      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
      >
        {icon}
      </div>

      <div className="min-w-0">
        <h2 className="break-words text-base font-semibold text-slate-900 dark:text-white sm:text-lg">
          {title}
        </h2>

        <p className="break-words text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      </div>
    </div>
  );
}
