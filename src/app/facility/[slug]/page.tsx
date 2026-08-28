import Link from "next/link";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import {
  Building2,
  Hospital,
  Sparkles,
  Stethoscope,
  Pill,
  Home,
  MapPin,
  Phone,
  ArrowLeft,
  UserCheck,
  Calendar,
  Clock,
  ShieldCheck,
  Ambulance,
  HeartPulse,
  Syringe,
  Activity,
  CreditCard,
  PhoneCall,
  CheckCircle2,
  ChevronRight,
  FlaskConical,
} from "lucide-react";
import { FacilityTestCatalog } from "@/components/facility-test-catalog";
import { FacilityCategorizedDoctors } from "@/components/facility-categorized-doctors";
import { FacilityLogo } from "@/components/facility-logo";

type Props = { params: Promise<{ slug: string }> };

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any; schemaType: string }
> = {
  HOSPITAL: {
    label: "Hospital",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Hospital,
    schemaType: "Hospital",
  },
  DIAGNOSTIC: {
    label: "Diagnostic & Lab Center",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    icon: Sparkles,
    schemaType: "MedicalClinic",
  },
  CLINIC: {
    label: "Specialized Clinic",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Stethoscope,
    schemaType: "MedicalClinic",
  },
  PHARMACY: {
    label: "Pharmacy & Medicine Store",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: Pill,
    schemaType: "Pharmacy",
  },
  CHAMBER: {
    label: "Doctor Chamber",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Home,
    schemaType: "MedicalClinic",
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const facility = await prisma.facility.findUnique({
    where: { slug },
    include: { 
      upazila: { include: { district: true } },
      tests: { where: { isActive: true }, take: 5 },
    },
  });
  if (!facility) {
    return { title: "Facility Not Found | Doctor Directory" };
  }
  const typeName = TYPE_CONFIG[facility.type]?.label || facility.type;
  const location = [facility.upazila?.name, facility.upazila?.district?.name]
    .filter(Boolean)
    .join(", ");
  
  const siteUrl = process.env.NEXTAUTH_URL || "https://doctordirectory.com";
  const pageUrl = `${siteUrl}/facility/${facility.slug}`;
  
  const testNames = facility.tests.map(t => t.name).join(", ");
  const description = `Diagnostic test pricing list, doctor schedule, emergency numbers, and contact details for ${facility.name} in ${location}. ${facility.tests.length > 0 ? `Tests available: ${testNames}.` : ""} Hotline: ${facility.hotline || facility.phone || "N/A"}.`;
  
  return {
    title: `${facility.name} - ${typeName} in ${location} | Doctor Directory`,
    description: description.slice(0, 160),
    keywords: [
      facility.name,
      typeName,
      `${typeName} in ${facility.upazila?.district?.name || "Bangladesh"}`,
      `${facility.name} ${facility.upazila?.district?.name || ""}`,
      `${facility.name} doctor list`,
      `${facility.name} test price`,
      ...facility.tests.slice(0, 5).map(t => `${t.name} ${facility.name}`),
    ],
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${facility.name} - ${typeName} in ${location} | Doctor Directory`,
      description: description.slice(0, 160),
      url: pageUrl,
      siteName: "Doctor Directory",
      type: "website",
      images: facility.logo
        ? [
            {
              url: facility.logo,
              alt: `${facility.name} Logo`,
            },
          ]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title: `${facility.name} - ${typeName} in ${location} | Doctor Directory`,
      description: description.slice(0, 160),
      images: facility.logo ? [facility.logo] : [],
    },
  };
}

export default async function FacilityPage({ params }: Props) {
  const { slug } = await params;
  const facility = await prisma.facility.findUnique({
    where: { slug },
    include: {
      upazila: { include: { district: { include: { division: true } } } },
      tests: {
        where: { isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
      },
      doctorFacilities: {
        include: {
          doctor: {
            include: { specialty: { select: { id: true, name: true, slug: true } } },
          },
        },
      },
    },
  });
  if (!facility) notFound();

  const typeConfig = TYPE_CONFIG[facility.type] || {
    label: facility.type,
    bg: "bg-slate-50",
    text: "text-slate-700",
    border: "border-slate-200",
    icon: Building2,
    schemaType: "MedicalOrganization",
  };
  const TypeIcon = typeConfig.icon;

  const locationText = [
    facility.upazila?.name,
    facility.upazila?.district?.name,
    facility.upazila?.district?.division?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const siteUrl = process.env.NEXTAUTH_URL || "https://doctordirectory.com";
  const pageUrl = `${siteUrl}/facility/${facility.slug}`;

  // Schema.org structured data for the facility
  const facilitySchema = {
    "@context": "https://schema.org",
    "@type": [typeConfig.schemaType, "MedicalBusiness"],
    name: facility.name,
    description: `${typeConfig.label} located in ${locationText}.`,
    url: pageUrl,
    image: facility.logo || undefined,
    telephone: facility.phone || facility.hotline || undefined,
    email: facility.email || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: facility.address || "",
      addressLocality: facility.upazila?.name || "",
      addressRegion: facility.upazila?.district?.name || "",
      addressCountry: "BD",
    },
    priceRange: "৳৳",
    medicalSpecialty: facility.doctorFacilities
      .map((df) => df.doctor.specialty?.name)
      .filter(Boolean)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 5),
    hasOfferCatalog: facility.tests.length > 0 ? {
      "@type": "OfferCatalog",
      name: `${facility.name} - Diagnostic Tests & Services`,
      itemListElement: facility.tests.slice(0, 10).map((test) => ({
        "@type": "Offer",
        name: test.name,
        category: test.category,
        price: test.discountPrice || test.price,
        priceCurrency: "BDT",
        availability: "https://schema.org/InStock",
      })),
    } : undefined,
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
        item: `${siteUrl}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Facilities & Centers",
        item: `${siteUrl}/facilities`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: facility.name,
        item: pageUrl,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Schema.org Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(facilitySchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap pb-1" aria-label="Breadcrumb">
        <Link href="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/facilities" className="hover:text-slate-900 transition">
          Facilities & Centers
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-none">
          {facility.name}
        </span>
      </nav>

      {/* Facility Hero Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-5 max-w-3xl">
            <FacilityLogo
              src={facility.logo}
              name={facility.name}
              type={facility.type}
              size="xl"
              shape="rounded"
              className="shadow-sm mt-1 shrink-0"
            />
            <div className="space-y-3 flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
                >
                  <TypeIcon className="h-4 w-4" />
                  {typeConfig.label}
                </span>
                <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                  <UserCheck className="h-3.5 w-3.5" />
                  {facility.doctorFacilities.length} Doctors
                </span>
                {facility.isVerified && (
                  <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    Verified
                  </span>
                )}
              </div>

              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
                {facility.name}
              </h1>

              {locationText && (
                <p className="flex items-center gap-1.5 text-sm text-slate-600">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{locationText}</span>
                </p>
              )}

              {facility.address && (
                <div className="rounded-2xl bg-slate-50 p-3.5 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                  <strong className="text-slate-900 block mb-0.5">Location & Address:</strong>
                  {facility.address}
                </div>
              )}
            </div>
          </div>

          {/* Action Box */}
          <div className="flex flex-col gap-3 shrink-0 lg:w-72 w-full">
            {facility.hotline || facility.phone ? (
              <a
                href={`tel:${facility.hotline || facility.phone}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-xs hover:bg-slate-800 transition"
              >
                <Phone className="h-4 w-4" /> Hotline: {facility.hotline || facility.phone}
              </a>
            ) : null}

            {facility.emergencyContact && (
              <a
                href={`tel:${facility.emergencyContact}`}
                className="flex items-center justify-center gap-2 rounded-2xl bg-rose-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-rose-700 transition"
              >
                <Ambulance className="h-4 w-4" /> Emergency: {facility.emergencyContact}
              </a>
            )}

            {facility.phone && (
              <a
                href={`https://wa.me/${facility.phone.replace(/[^0-9]/g, "")}?text=Hello,%20I%20am%20inquiring%20about%20services%20at%20${encodeURIComponent(facility.name)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
              >
                <span>Inquire via WhatsApp Desk</span>
              </a>
            )}

            {!facility.profileClaimed ? (
              <Link
                href={`/dashboard/claim-facility?facilityId=${facility.id}`}
                className="flex items-center justify-center gap-1.5 rounded-2xl border border-dashed border-indigo-300 bg-indigo-50/60 p-3 text-center text-xs font-semibold text-indigo-700 hover:bg-indigo-100/70 transition"
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>Claim This Institute Profile</span>
              </Link>
            ) : (
              <div className="rounded-2xl bg-slate-50 p-3 text-center border border-slate-100 text-[11px] text-slate-500">
                Official Managed Medical Institute
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Clinical Facilities & Services (Only shown when configured by admin or facility admin) */}
      {(() => {
        const clinicalServiceCategories = new Set([
          "Emergency & Critical Care",
          "Specialized Medical Services",
          "Pediatric & Maternal Care",
          "Clinical Laboratory & Blood",
          "Pharmacy & Dispensary",
          "Rehabilitation & Therapy",
          "Surgical Suites",
          "Home Health Care",
          "Insurance & Billing",
        ]);

        const activeClinicalServices = facility.tests.filter(
          (t) =>
            t.code.startsWith("SERV-") ||
            clinicalServiceCategories.has(t.category)
        );

        if (activeClinicalServices.length === 0) return null;

        return (
          <div className="rounded-3xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-sm space-y-5">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="h-5 w-5 text-teal-700" />
                Key Clinical Facilities & Services ({activeClinicalServices.length})
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Available medical amenities, specialized patient care units, and emergency services at {facility.name}.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
              {activeClinicalServices.map((serv) => (
                <div
                  key={serv.id}
                  className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4 space-y-2 hover:bg-white hover:border-teal-300 transition"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-100/80 text-teal-800 shrink-0">
                      <Activity className="h-4 w-4" />
                    </div>
                    {serv.price > 0 ? (
                      <div className="text-right">
                        {serv.discountPrice ? (
                          <div className="flex items-center gap-1">
                            <span className="text-[11px] text-slate-400 line-through">
                              ৳{serv.price.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-emerald-800">
                              ৳{serv.discountPrice.toLocaleString()}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs font-bold text-slate-900">
                            ৳{serv.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                        Facility Unit
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900">{serv.name}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">{serv.category}</p>
                  </div>

                  {serv.description && (
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      {serv.description}
                    </p>
                  )}

                  {(serv.deliveryTime || serv.preparation) && (
                    <div className="text-[10px] text-slate-500 border-t border-slate-200/60 pt-1.5 space-y-0.5">
                      {serv.deliveryTime && <div>Turnaround: {serv.deliveryTime}</div>}
                      {serv.preparation && <div className="truncate">Note: {serv.preparation}</div>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Diagnostic & Pathology Test Catalog Section */}
      <FacilityTestCatalog
        facilityName={facility.name}
        facilityPhone={facility.phone}
        facilityType={facility.type}
        tests={facility.tests}
      />

      {/* Categorized Specialist Doctors Section */}
      <FacilityCategorizedDoctors
        facilityName={facility.name}
        doctorFacilities={facility.doctorFacilities.map((df) => ({
          id: df.id,
          doctor: {
            id: df.doctor.id,
            fullName: df.doctor.fullName,
            slug: df.doctor.slug,
            degrees: df.doctor.degrees,
            designation: df.doctor.designation,
            profilePhoto: df.doctor.profilePhoto,
            consultationFee: df.doctor.consultationFee,
            visitingHours: df.doctor.visitingHours,
            specialty: df.doctor.specialty
              ? {
                  id: df.doctor.specialty.id,
                  name: df.doctor.specialty.name,
                  slug: df.doctor.specialty.slug,
                }
              : null,
          },
        }))}
      />
    </main>
  );
}
