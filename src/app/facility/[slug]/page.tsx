import Link from "next/link";
import { notFound } from "next/navigation";
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

type Props = { params: Promise<{ slug: string }> };

const TYPE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; border: string; icon: any }
> = {
  HOSPITAL: {
    label: "Hospital",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    icon: Hospital,
  },
  DIAGNOSTIC: {
    label: "Diagnostic & Lab Center",
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-200",
    icon: Sparkles,
  },
  CLINIC: {
    label: "Specialized Clinic",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    icon: Stethoscope,
  },
  PHARMACY: {
    label: "Pharmacy & Medicine Store",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    icon: Pill,
  },
  CHAMBER: {
    label: "Doctor Chamber",
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    icon: Home,
  },
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const facility = await prisma.facility.findUnique({
    where: { slug },
    include: { upazila: { include: { district: true } } },
  });
  if (!facility) {
    return { title: "Facility Not Found | Doctor Directory" };
  }
  const typeName = TYPE_CONFIG[facility.type]?.label || facility.type;
  const location = [facility.upazila?.name, facility.upazila?.district?.name]
    .filter(Boolean)
    .join(", ");
  return {
    title: `${facility.name} - ${typeName} in ${location} | Doctor Directory`,
    description: `Diagnostic test pricing list, doctor schedule, emergency numbers, and contact details for ${facility.name} in ${location}.`,
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
  };
  const TypeIcon = typeConfig.icon;

  const locationText = [
    facility.upazila?.name,
    facility.upazila?.district?.name,
    facility.upazila?.district?.division?.name,
  ]
    .filter(Boolean)
    .join(", ");

  const isHospitalOrDiagnostic =
    facility.type === "HOSPITAL" ||
    facility.type === "DIAGNOSTIC" ||
    facility.type === "CLINIC";

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 overflow-x-auto whitespace-nowrap">
        <Link href="/" className="hover:text-slate-900 transition">
          Home
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <Link href="/search" className="hover:text-slate-900 transition">
          Facilities & Centers
        </Link>
        <ChevronRight className="h-3 w-3 text-slate-400" />
        <span className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-none">
          {facility.name}
        </span>
      </nav>

      {/* Facility Hero Card */}
      <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1 text-xs font-semibold ${typeConfig.bg} ${typeConfig.text} ${typeConfig.border}`}
              >
                <TypeIcon className="h-4 w-4" />
                {typeConfig.label}
              </span>
              <span className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                <UserCheck className="h-3.5 w-3.5" />
                {facility.doctorFacilities.length} Practicing Doctors
              </span>
              {facility.isVerified && (
                <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800 border border-emerald-200">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                  Verified Center
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
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

          {/* Action Box */}
          <div className="flex flex-col gap-3 shrink-0 lg:w-72">
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

            <a
              href={`https://wa.me/8801700000000?text=Hello,%20I%20am%20inquiring%20about%20services%20at%20${encodeURIComponent(facility.name)}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900 hover:bg-emerald-100 transition shadow-2xs"
            >
              <span>Inquire via WhatsApp Desk</span>
            </a>

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

      {/* Key Hospital & Diagnostic Services Grid */}
      {isHospitalOrDiagnostic && (
        <div className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2">
              <Activity className="h-5 w-5 text-indigo-600" />
              Key Clinical Facilities & Services
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Available round-the-clock medical amenities, specialized patient care units, and diagnostics.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 text-xs">
            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
                <HeartPulse className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">24/7 Emergency & Trauma</h3>
              <p className="text-[11px] text-slate-500">Immediate critical care & resuscitation desk</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <Ambulance className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">24/7 Ambulance Fleet</h3>
              <p className="text-[11px] text-slate-500">Equipped with Oxygen & ICU transport</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <FlaskConical className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">Automated Lab Tests</h3>
              <p className="text-[11px] text-slate-500">High-precision computerized pathology</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <Pill className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">24-Hour Pharmacy</h3>
              <p className="text-[11px] text-slate-500">Authentic medicine & emergency supplies</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700">
                <Syringe className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">Blood Bank Unit</h3>
              <p className="text-[11px] text-slate-500">Cross-matching & transfusion safety</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-50 text-purple-700">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">Digital Imaging & USG</h3>
              <p className="text-[11px] text-slate-500">Digital X-Ray, 4D USG, CT & MRI Scans</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Activity className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">ICU, CCU & NICU</h3>
              <p className="text-[11px] text-slate-500">Advanced neonatal & adult critical units</p>
            </div>

            <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                <CreditCard className="h-4 w-4" />
              </div>
              <h3 className="font-bold text-slate-900 pt-1">Corporate & Insurance</h3>
              <p className="text-[11px] text-slate-500">Cashless claims & health card discounts</p>
            </div>
          </div>
        </div>
      )}

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
