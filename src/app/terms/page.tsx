import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description:
    "Terms & Conditions for Doctor Directory Bangladesh — listings, appointments, payments, medical disclaimer and acceptable use.",
};

const UPDATED = "September 5, 2026";

export default function TermsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Legal
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Terms &amp; Conditions
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm sm:rounded-3xl sm:p-8">
        <section>
          <h2 className="text-base font-semibold text-slate-900">
            1. The service
          </h2>
          <p className="mt-1">
            Doctor Directory provides an online directory of doctors,
            hospitals and diagnostic centers in Bangladesh, including
            specialties, chamber addresses, visiting hours, test prices and
            appointment requests. We are a listing and booking facilitator —
            we do not operate clinics or provide medical treatment.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            2. Medical disclaimer — emergencies
          </h2>
          <p className="mt-1">
            Content on this site is for general information only and is not
            medical advice, diagnosis or treatment. Always seek the advice of
            a qualified doctor with questions about a medical condition. In an
            emergency in Bangladesh call{" "}
            <strong className="text-slate-800">999</strong> or go to the
            nearest hospital immediately — do not rely on this website.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            3. Listings &amp; verification
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              &ldquo;Verified&rdquo; means we have checked available
              credentials (e.g. BMDC registration where provided) at review
              time; it is not a guarantee of outcomes or availability.
            </li>
            <li>
              Doctors and facilities are responsible for keeping degrees,
              chamber times, fees and contact details accurate and lawful.
            </li>
            <li>
              We may edit, suspend or remove listings that are inaccurate,
              misleading, unlawful or violate these terms.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            4. Appointments &amp; fees
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              Appointment requests are subject to confirmation by the doctor /
              facility. Serials and visiting hours may change.
            </li>
            <li>
              Consultation fees shown are as reported by providers; confirm
              before visiting.
            </li>
            <li>
              Online payments (e.g. bKash, where enabled) are processed by
              third-party gateways; their terms and refund timelines apply.
            </li>
            <li>
              Cancellations and refunds follow the concerned provider&apos;s
              policy unless stated otherwise at booking.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            5. Accounts &amp; acceptable use
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Provide true information and keep credentials confidential.</li>
            <li>
              Do not impersonate doctors, upload fake credentials, scrape at
              abusive rates, or post unlawful, defamatory or misleading
              content.
            </li>
            <li>
              Reviews, where enabled, must reflect genuine experience and must
              not disclose another patient&apos;s private health data.
            </li>
            <li>We may suspend accounts that abuse the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            6. Intellectual property
          </h2>
          <p className="mt-1">
            Site design, text and logos belong to us or our licensors. You may
            view and share public pages with attribution, but may not copy the
            database in bulk or reuse content to build a competing directory
            without permission.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            7. Third-party services
          </h2>
          <p className="mt-1">
            Maps, login providers, SMS and payment gateways are operated by
            third parties under their own terms. We are not responsible for
            their downtime or policies, though we choose providers carefully.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            8. Limitation of liability
          </h2>
          <p className="mt-1">
            To the maximum extent permitted by law, we are not liable for
            indirect losses, missed appointments, treatment outcomes, or for
            reliance on directory information. Our total liability for paid
            services is limited to the amount you paid for the booking at
            issue.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            9. Governing law &amp; changes
          </h2>
          <p className="mt-1">
            These terms are governed by the laws of Bangladesh. We may update
            them; continued use after posting means acceptance. Material
            changes will be dated above.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/privacy"
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Read Privacy Policy
          </Link>
          <Link
            href="/search"
            className="rounded-xl bg-slate-950 px-4 py-2 font-semibold text-white transition hover:bg-slate-800"
          >
            Find Doctors
          </Link>
        </div>
      </div>
    </main>
  );
}
