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
  DollarSign,
  UserCheck,
} from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const doctor = await prisma.doctor.findUnique({
    where: { slug },
    include: { specialty: true },
  });

  if (!doctor || doctor.status === "BLOCKED") {
    return { title: "Doctor Not Found | Doctor Directory" };
  }

  const specialtyName = doctor.specialty?.name || "Specialist Doctor";
  const location = [doctor.area, doctor.city].filter(Boolean).join(", ") || "Bangladesh";
  const title = `${doctor.fullName} - ${specialtyName} in ${location} | Chamber, Visiting Hours & Fees`;
  const description = `${doctor.fullName} (${doctor.degrees || specialtyName})${
    doctor.designation ? ` - ${doctor.designation}` : ""
  }. Practicing at ${doctor.hospitalName || doctor.chamberAddress || location}. Visiting hours: ${
    doctor.visitingHours || "Contact for schedule"
  }. Consultation Fee: ৳${doctor.consultationFee || "N/A"}. BMDC Reg: ${doctor.bmdcNumber || "Verified"}.`;

  const siteUrl = process.env.NEXTAUTH_URL || "https://doctordirectory.com";
  const pageUrl = `${siteUrl}/doctor/${doctor.slug}`;

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
      doctor.bmdcNumber ? `BMDC ${doctor.bmdcNumber}` : "",
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
      images: doctor.profilePhoto ? [doctor.profilePhoto] : [],
    },
  };
}

export default async function DoctorPage({ params }: Props) {
  const { slug } = await params;
  const session = await auth();
  const doctor = await prisma.doctor.findUnique({
    where: { slug },
    include: {
      specialty: true,
      blogs: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
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
                    include: { division: true },
                  },
                },
              },
            },
          },
        },
      },
      reviews: {
        where: { isApproved: true },
        orderBy: { createdAt: "desc" },
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });

  if (!doctor || doctor.status === "BLOCKED") notFound();

  const avgRating =
    doctor.reviews.length > 0
      ? doctor.reviews.reduce((s, r) => s + r.rating, 0) / doctor.reviews.length
      : null;

  const isOwnProfile =
    session?.user &&
    doctor.userId !== null &&
    Number(session.user.id) === doctor.userId;

  // Format services list
  const servicesList = doctor.services
    ? doctor.services
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    : [];

  // Parse degrees
  const degreesList = doctor.degrees
    ? doctor.degrees
        .split(/[,;]/)
        .map((d) => d.trim())
        .filter((d) => d.length > 0)
    : [];

  const appointmentPhone = doctor.appointmentPhone || doctor.phone;
  const cleanPhoneForDial = appointmentPhone?.replace(/[^0-9+]/g, "");

  // Generate structured FAQs for SEO Rich Snippets
  const faqItems = [
    {
      question: `What are the consultation fees for ${doctor.fullName}?`,
      answer: doctor.consultationFee
        ? `The new patient consultation fee for ${doctor.fullName} is ৳${doctor.consultationFee}.${
            doctor.followUpFee ? ` Follow-up consultation fee is ৳${doctor.followUpFee}.` : ""
          }`
        : `Please call ${appointmentPhone || "the chamber"} for current consultation and follow-up fees.`,
    },
    {
      question: `What is the visiting schedule and chamber location for ${doctor.fullName}?`,
      answer: `${doctor.fullName} practices at ${doctor.hospitalName || "Chamber"}${
        doctor.chamberAddress ? `, ${doctor.chamberAddress}` : ""
      }${doctor.city ? `, ${doctor.city}` : ""}. Visiting hours are: ${
        doctor.visitingHours || "by prior appointment"
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
        doctor.degrees || doctor.specialty?.name || "Medical degree"
      }${doctor.experienceYears ? ` with over ${doctor.experienceYears} years of clinical experience` : ""}${
        doctor.bmdcNumber ? ` and is registered under BMDC Reg No. ${doctor.bmdcNumber}` : ""
      }.`,
    },
  ];

  // Schema.org Physician JSON-LD
  const physicianSchema = {
    "@context": "https://schema.org",
    "@type": ["Physician", "MedicalBusiness"],
    name: doctor.fullName,
    description: doctor.about || `${doctor.fullName} - ${doctor.specialty?.name || "Doctor"}`,
    image: doctor.profilePhoto || undefined,
    url: `${process.env.NEXTAUTH_URL || "https://doctordirectory.com"}/doctor/${doctor.slug}`,
    telephone: appointmentPhone || undefined,
    email: doctor.email || undefined,
    medicalSpecialty: doctor.specialty?.name ? `https://schema.org/${doctor.specialty.name.replace(/\s+/g, "")}` : "GeneralMedicine",
    priceRange: doctor.consultationFee ? `৳${doctor.consultationFee}` : "৳৳",
    hasCredential: [
      doctor.degrees ? { "@type": "EducationalOccupationalCredential", credentialCategory: "degree", name: doctor.degrees } : null,
      doctor.bmdcNumber ? { "@type": "EducationalOccupationalCredential", credentialCategory: "medicalLicense", name: `BMDC Reg ${doctor.bmdcNumber}` } : null,
    ].filter(Boolean),
    address: {
      "@type": "PostalAddress",
      streetAddress: doctor.chamberAddress || doctor.hospitalName || "",
      addressLocality: doctor.city || "Dhaka",
      addressRegion: doctor.area || "",
      addressCountry: "BD",
    },
    isAcceptingNewPatients: true,
    ...(avgRating && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: avgRating.toFixed(1),
        reviewCount: doctor.reviews.length,
        bestRating: "5",
        worstRating: "1",
      },
    }),
    ...(servicesList.length > 0 && {
      availableService: servicesList.map((service) => ({
        "@type": "MedicalProcedure",
        name: service,
      })),
    }),
  };

  // BreadcrumbList JSON-LD
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${process.env.NEXTAUTH_URL || "https://doctordirectory.com"}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: doctor.specialty?.name || "Doctors",
        item: `${process.env.NEXTAUTH_URL || "https://doctordirectory.com"}/search?specialtyId=${doctor.specialtyId || ""}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: doctor.fullName,
        item: `${process.env.NEXTAUTH_URL || "https://doctordirectory.com"}/doctor/${doctor.slug}`,
      },
    ],
  };

  // FAQPage JSON-LD
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="min-h-screen bg-slate-50/50 pb-12 sm:pb-16">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(physicianSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Navigation Breadcrumb Bar */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap pb-1" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-slate-900 transition">
              Home
            </Link>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <Link href="/search" className="hover:text-slate-900 transition">
              Find Doctors
            </Link>
            {doctor.specialty && (
              <>
                <ChevronRight className="h-3 w-3 text-slate-400" />
                <Link
                  href={`/search?specialty=${doctor.specialty.slug}`}
                  className="hover:text-slate-900 transition"
                >
                  {doctor.specialty.name}
                </Link>
              </>
            )}
            <ChevronRight className="h-3 w-3 text-slate-400" />
            <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-none">
              {doctor.fullName}
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-4 sm:pt-6 space-y-6">
        {/* Unclaimed Profile Banner with Instructions */}
        {!doctor.profileClaimed && !isOwnProfile && (
          <DoctorClaimBanner doctorId={doctor.id} doctorName={doctor.fullName} />
        )}

        {/* Doctor Main Hero Card */}
        <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-8 shadow-sm">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-6 sm:gap-8">
            <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 w-full lg:w-auto">
              <div className="relative shrink-0">
                <UserAvatar
                  src={doctor.profilePhoto}
                  name={doctor.fullName}
                  size="xl"
                  className="h-24 w-24 sm:h-32 sm:w-32 rounded-2xl ring-4 ring-slate-100 shadow-md object-cover"
                />
                {doctor.isVerified && (
                  <span
                    className="absolute -bottom-2 -right-2 flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow-sm ring-2 ring-white"
                    title="BMDC Verified Medical Practitioner"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    Verified
                  </span>
                )}
              </div>

              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                    {doctor.fullName}
                  </h1>
                </div>

                {/* Degrees */}
                {doctor.degrees && (
                  <p className="text-sm font-medium text-indigo-900/90 leading-snug">
                    {doctor.degrees}
                  </p>
                )}

                {/* Designation & Hospital */}
                <div className="text-sm text-slate-600 space-y-0.5">
                  {doctor.designation && (
                    <p className="font-medium text-slate-800">{doctor.designation}</p>
                  )}
                  {doctor.hospitalName && (
                    <p className="flex items-center gap-1.5 text-slate-600">
                      <Building2 className="h-4 w-4 text-slate-400 shrink-0" />
                      <span>{doctor.hospitalName}</span>
                    </p>
                  )}
                </div>

                {/* Badges & Meta */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {doctor.specialty && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                      <Stethoscope className="h-3.5 w-3.5" />
                      {doctor.specialty.name}
                    </span>
                  )}

                  {doctor.experienceYears !== null && doctor.experienceYears > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      <Award className="h-3.5 w-3.5 text-slate-500" />
                      {doctor.experienceYears}+ Years
                    </span>
                  )}

                  {doctor.bmdcNumber && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800">
                      BMDC: {doctor.bmdcNumber}
                    </span>
                  )}
                </div>

                {/* Star Ratings */}
                {avgRating !== null ? (
                  <div className="flex items-center gap-2 pt-1 text-sm">
                    <div className="flex items-center text-amber-500" aria-label={`Rated ${avgRating.toFixed(1)} out of 5`}>
                      {"★".repeat(Math.round(avgRating))}
                      {"☆".repeat(5 - Math.round(avgRating))}
                    </div>
                    <span className="font-semibold text-slate-900">{avgRating.toFixed(1)}</span>
                    <span className="text-slate-500">
                      ({doctor.reviews.length} review{doctor.reviews.length === 1 ? "" : "s"})
                    </span>
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 pt-1">Verified Medical Profile</p>
                )}
              </div>
            </div>

            {/* Right Action Panel / CTA Card */}
            <div className="w-full lg:w-72 shrink-0 rounded-2xl bg-slate-50 p-5 border border-slate-200/80 space-y-4">
              <div className="flex items-baseline justify-between border-b border-slate-200 pb-3">
                <div>
                  <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                    New Patient Fee
                  </span>
                  <p className="text-2xl font-bold text-slate-900">
                    {doctor.consultationFee ? `৳${doctor.consultationFee}` : "Call for info"}
                  </p>
                </div>
                {doctor.followUpFee && (
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                      Follow-up
                    </span>
                    <p className="text-lg font-semibold text-slate-700">৳{doctor.followUpFee}</p>
                  </div>
                )}
              </div>

              {/* Primary Call / Serial Booking Action */}
              <div className="space-y-2">
                {appointmentPhone ? (
                  <a
                    href={`tel:${cleanPhoneForDial}`}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                    aria-label={`Call to book appointment: ${appointmentPhone}`}
                  >
                    <Phone className="h-4 w-4" />
                    Book Serial: {appointmentPhone}
                  </a>
                ) : (
                  <div className="text-center rounded-2xl bg-slate-200/60 p-3 text-xs text-slate-600 font-medium">
                    Contact hospital reception for serial
                  </div>
                )}

                {appointmentPhone && (
                  <a
                    href={`https://wa.me/${cleanPhoneForDial?.replace("+", "")}?text=Hello,%20I%20would%20like%20to%20book%20a%20doctor%20appointment%20serial%20for%20${encodeURIComponent(doctor.fullName)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 transition"
                  >
                    <MessageCircle className="h-4 w-4 text-emerald-600" />
                    WhatsApp Booking
                  </a>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <DoctorShareButton
                  doctorName={doctor.fullName}
                  specialty={doctor.specialty?.name}
                />
                {isOwnProfile && (
                  <Link
                    href="/dashboard"
                    className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Edit Profile
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 2-Column Content Layout */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Left Column (2 Cols wide) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Chamber & Schedule Card */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 shrink-0">
                    <Clock className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                      Chamber & Visiting Schedule
                    </h2>
                    <p className="text-xs text-slate-500">Consultation timings and room info</p>
                  </div>
                </div>
                {appointmentPhone && (
                  <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {/* Visiting Hours Highlight */}
                {doctor.visitingHours && (
                  <div className="rounded-2xl bg-indigo-50/60 border border-indigo-100 p-4">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-indigo-600 mt-0.5 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-indigo-900 uppercase tracking-wide">
                          Visiting Days & Hours
                        </span>
                        <p className="mt-0.5 text-sm font-semibold text-slate-900">
                          {doctor.visitingHours}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Chamber Address */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {doctor.hospitalName && (
                    <div className="space-y-1">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Hospital / Diagnostic Center
                      </span>
                      <p className="text-sm font-semibold text-slate-900">
                        {doctor.hospitalName}
                      </p>
                    </div>
                  )}

                  {doctor.chamberAddress && (
                    <div className="space-y-1 sm:col-span-2">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" /> Chamber Location & Room
                      </span>
                      <p className="text-sm text-slate-800 whitespace-pre-line">
                        {doctor.chamberAddress}
                      </p>
                      {doctor.city && (
                        <p className="text-xs text-slate-500">
                          Location: {[doctor.area, doctor.city].filter(Boolean).join(", ")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Google Maps Search Helper */}
                {doctor.chamberAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${doctor.hospitalName || ""} ${doctor.chamberAddress} ${doctor.city || ""}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition"
                  >
                    Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </section>

            {/* Conditions Treated & Services Offered */}
            {servicesList.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700 shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                      Conditions Treated & Medical Services
                    </h2>
                    <p className="text-xs text-slate-500">Areas of clinical focus and procedures</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {servicesList.map((service, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-800 hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-900 transition"
                    >
                      {service}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* About / Clinical Biography */}
            {doctor.about && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-3">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700 shrink-0">
                    <Award className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">About the Doctor</h2>
                    <p className="text-xs text-slate-500">Professional background & care philosophy</p>
                  </div>
                </div>
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-line">
                  {doctor.about}
                </p>
              </section>
            )}

            {/* Affiliated Hospitals & Facilities */}
            {doctor.doctorFacilities.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700 shrink-0">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                      Practices & Hospital Attachments
                    </h2>
                    <p className="text-xs text-slate-500">Hospitals and diagnostic centers affiliated with this doctor</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {doctor.doctorFacilities.map((df) => (
                    <div
                      key={df.id}
                      className="flex items-start gap-3.5 rounded-2xl border border-slate-200 p-4 hover:border-indigo-200 transition"
                    >
                      <FacilityLogo
                        src={df.facility.logo}
                        name={df.facility.name}
                        type={df.facility.type}
                        size="md"
                        shape="rounded"
                        className="shadow-2xs mt-0.5 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/facility/${df.facility.slug}`}
                          className="font-semibold text-slate-900 hover:text-indigo-700 text-sm flex items-center justify-between gap-1"
                        >
                          <span className="truncate">{df.facility.name}</span>
                          <ExternalLink className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        </Link>
                        <p className="mt-1 text-xs text-slate-500 font-medium">
                          {df.facility.type}
                          {df.facility.upazila &&
                            ` · ${df.facility.upazila.name}${df.facility.upazila.district?.name ? `, ${df.facility.upazila.district.name}` : ""}`}
                        </p>
                        {df.facility.address && (
                          <p className="mt-1 text-xs text-slate-600 truncate">{df.facility.address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Doctor's Published Articles & Health Advice */}
            {doctor.blogs && doctor.blogs.length > 0 && (
              <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-50 text-purple-700 shrink-0">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                      Health Articles by {doctor.fullName}
                    </h2>
                    <p className="text-xs text-slate-500">Medical advice and health guidance</p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {doctor.blogs.map((b) => (
                    <Link
                      key={b.id}
                      href={`/blog/${b.slug}`}
                      className="rounded-2xl border border-slate-200 p-4 hover:border-purple-300 hover:bg-purple-50/30 transition block space-y-1"
                    >
                      <h3 className="text-sm font-semibold text-slate-900 line-clamp-2">
                        {b.title}
                      </h3>
                      {b.excerpt && (
                        <p className="text-xs text-slate-600 line-clamp-2">{b.excerpt}</p>
                      )}
                      {b.publishedAt && (
                        <p className="text-[11px] text-slate-400 pt-1">
                          {new Date(b.publishedAt).toLocaleDateString()}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Frequently Asked Questions (FAQ Section) for Patients & SEO Rich Snippets */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-700 shrink-0">
                  <HelpCircle className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-xs text-slate-500">Common questions about appointments and chamber visits</p>
                </div>
              </div>

              <div className="space-y-3">
                {faqItems.map((faq, idx) => (
                  <details
                    key={idx}
                    className="group rounded-2xl border border-slate-200 bg-slate-50/50 p-4 open:bg-white open:ring-1 open:ring-slate-200 transition"
                  >
                    <summary className="flex items-center justify-between gap-2 cursor-pointer font-semibold text-slate-900 text-sm list-none">
                      <span>{faq.question}</span>
                      <span className="text-slate-400 group-open:rotate-180 transition-transform shrink-0">
                        ▼
                      </span>
                    </summary>
                    <p className="mt-3 text-sm text-slate-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </details>
                ))}
              </div>
            </section>

            {/* Patient Reviews & Feedback */}
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h2 className="text-base sm:text-lg font-semibold text-slate-900">Patient Reviews</h2>
                  <p className="text-xs text-slate-500">Verified feedback from consulted patients</p>
                </div>
                {avgRating !== null && (
                  <div className="text-right shrink-0">
                    <span className="text-xl font-bold text-slate-900">{avgRating.toFixed(1)}</span>
                    <span className="text-xs text-slate-500"> / 5.0</span>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                {doctor.reviews.length === 0 ? (
                  <div className="rounded-2xl border border-slate-200/80 bg-slate-50/50 p-6 text-center text-sm text-slate-500">
                    No verified patient reviews yet. Be the first to leave a review!
                  </div>
                ) : (
                  doctor.reviews.map((r) => (
                    <div
                      key={r.id}
                      className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2 shadow-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <UserAvatar src={r.user.image} name={r.user.name} size="sm" />
                          <p className="text-sm font-semibold text-slate-900 truncate">{r.user.name}</p>
                        </div>
                        <div className="text-amber-500 text-sm shrink-0" aria-label={`${r.rating} stars`}>
                          {"★".repeat(r.rating)}
                        </div>
                      </div>
                      {r.comment && (
                        <p className="text-sm text-slate-700 leading-relaxed pl-0 sm:pl-10">{r.comment}</p>
                      )}
                      <p className="text-[11px] text-slate-400 pl-0 sm:pl-10">
                        {r.createdAt.toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Review Form */}
              <div className="pt-2">
                <ReviewForm
                  doctorId={doctor.id}
                  loggedIn={Boolean(session?.user) && !isOwnProfile}
                />
              </div>
            </section>
          </div>

          {/* Right Sidebar Details & Credentials Column */}
          <div className="space-y-6">
            {/* Quick Contact & Links */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
                Contact Details
              </h3>
              <ul className="space-y-3 text-sm">
                {appointmentPhone && (
                  <li>
                    <span className="text-xs uppercase tracking-wide text-slate-400 block">
                      Appointment Serial
                    </span>
                    <a
                      href={`tel:${cleanPhoneForDial}`}
                      className="font-semibold text-indigo-700 hover:underline flex items-center gap-1.5 mt-0.5"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {appointmentPhone}
                    </a>
                  </li>
                )}

                {doctor.phone && doctor.phone !== appointmentPhone && (
                  <li>
                    <span className="text-xs uppercase tracking-wide text-slate-400 block">
                      Direct Phone
                    </span>
                    <a
                      href={`tel:${doctor.phone.replace(/[^0-9+]/g, "")}`}
                      className="font-medium text-slate-800 hover:underline"
                    >
                      {doctor.phone}
                    </a>
                  </li>
                )}

                {doctor.email && (
                  <li>
                    <span className="text-xs uppercase tracking-wide text-slate-400 block">Email</span>
                    <a
                      href={`mailto:${doctor.email}`}
                      className="text-slate-800 hover:text-indigo-700 hover:underline flex items-center gap-1.5 mt-0.5 break-all"
                    >
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {doctor.email}
                    </a>
                  </li>
                )}

                {doctor.website && (
                  <li>
                    <span className="text-xs uppercase tracking-wide text-slate-400 block">
                      Website
                    </span>
                    <a
                      href={doctor.website}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-700 hover:underline flex items-center gap-1.5 mt-0.5 break-all text-xs"
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" />
                      {doctor.website}
                    </a>
                  </li>
                )}
              </ul>
            </div>

            {/* Medical Verification Card */}
            <div className="rounded-3xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-sm space-y-3">
              <h3 className="text-base font-semibold text-slate-900 border-b border-slate-100 pb-2.5">
                Medical Credentials
              </h3>
              <dl className="space-y-2.5 text-xs text-slate-600">
                <div>
                  <dt className="text-slate-400 uppercase tracking-wide font-medium">BMDC Status</dt>
                  <dd className="font-semibold text-slate-900 mt-0.5 flex items-center gap-1">
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
                    <dt className="text-slate-400 uppercase tracking-wide font-medium">BMDC Number</dt>
                    <dd className="font-mono text-slate-800 mt-0.5 break-all">{doctor.bmdcNumber}</dd>
                  </div>
                )}

                {doctor.gender && (
                  <div>
                    <dt className="text-slate-400 uppercase tracking-wide font-medium">Gender</dt>
                    <dd className="text-slate-800 capitalize mt-0.5">{doctor.gender.toLowerCase()}</dd>
                  </div>
                )}

                {doctor.experienceYears !== null && doctor.experienceYears > 0 && (
                  <div>
                    <dt className="text-slate-400 uppercase tracking-wide font-medium">Experience</dt>
                    <dd className="text-slate-800 mt-0.5">{doctor.experienceYears} Years</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Search Related Doctors Helper */}
            {doctor.specialty && (
              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/50 p-5 sm:p-6 space-y-3">
                <h3 className="text-sm font-semibold text-indigo-950">
                  Looking for more {doctor.specialty.name} specialists?
                </h3>
                <p className="text-xs text-indigo-900/80 leading-relaxed">
                  Browse our directory of verified {doctor.specialty.name.toLowerCase()} specialists across {doctor.city || "Bangladesh"}.
                </p>
                <Link
                  href={`/search?specialty=${doctor.specialty.slug}${doctor.city ? `&q=${encodeURIComponent(doctor.city)}` : ""}`}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
                >
                  View {doctor.specialty.name} Doctors <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
