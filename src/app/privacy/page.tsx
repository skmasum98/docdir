import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Doctor Directory Bangladesh — what data we collect, how we use it, appointments, cookies, and your rights.",
};

const UPDATED = "September 5, 2026";

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        Legal
      </p>
      <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-slate-500">Last updated: {UPDATED}</p>

      <div className="mt-6 space-y-6 rounded-2xl border border-slate-200 bg-white p-5 text-sm leading-6 text-slate-600 shadow-sm sm:rounded-3xl sm:p-8">
        <section>
          <h2 className="text-base font-semibold text-slate-900">
            1. Who we are
          </h2>
          <p className="mt-1">
            Doctor Directory (&ldquo;we&rdquo;, &ldquo;us&rdquo;) operates a
            healthcare directory for Bangladesh at drchamber.info, listing
            verified specialist doctors, hospitals and diagnostic centers,
            test prices and appointment information.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            2. Information we collect
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>
              <strong className="text-slate-800">Account data:</strong> name,
              email, phone, password (hashed), role and profile photo when you
              register or update your profile.
            </li>
            <li>
              <strong className="text-slate-800">Doctor / facility data:</strong>{" "}
              professional details you submit for listing (degrees, BMDC
              number, chamber address, visiting hours, fees).
            </li>
            <li>
              <strong className="text-slate-800">Appointment data:</strong>{" "}
              bookings, schedules and serial information.
            </li>
            <li>
              <strong className="text-slate-800">Usage data:</strong> pages
              visited, search queries and device/browser information for
              security and analytics.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            3. How we use information
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>Operate search, listings, appointments and user accounts.</li>
            <li>Verify doctor and facility information.</li>
            <li>Prevent fraud, abuse and unauthorized access.</li>
            <li>Send transactional messages (booking confirmations, OTPs).</li>
            <li>Improve the service and fix technical issues.</li>
          </ul>
          <p className="mt-2">
            We do not sell your personal information. Public directory
            listings (doctor name, specialty, chamber, fees) are shown
            publicly by design.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            4. Health information
          </h2>
          <p className="mt-1">
            Avoid sharing sensitive medical reports in public fields. Any
            health information you voluntarily provide in appointments or
            support messages is used only to provide the requested service and
            is accessible to relevant staff and the concerned provider.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            5. Cookies &amp; authentication
          </h2>
          <p className="mt-1">
            We use essential cookies / session storage for login sessions and
            security. Third-party auth providers (e.g. Google, if enabled) are
            governed by their own privacy policies.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            6. Data sharing
          </h2>
          <ul className="mt-1 list-disc space-y-1 pl-5">
            <li>With doctors / hospitals to fulfil your appointment.</li>
            <li>
              With service providers (hosting, SMS, payments such as bKash)
              only as needed to operate the service.
            </li>
            <li>When required by law or to protect safety and rights.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            7. Data retention &amp; security
          </h2>
          <p className="mt-1">
            We retain account and listing data while your account is active and
            as required by law. We use reasonable technical safeguards
            (encrypted transport, hashed passwords, role-based access), but no
            online service can guarantee absolute security.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            8. Your rights
          </h2>
          <p className="mt-1">
            You may request access, correction or deletion of your account
            data from your{" "}
            <Link
              href="/dashboard"
              className="font-medium text-slate-900 underline"
            >
              dashboard
            </Link>{" "}
            or by contacting us. Deleting an account removes profile access;
            published directory records may be retained where legally required
            for audit.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            9. Children
          </h2>
          <p className="mt-1">
            The service is not directed to children under 13. Accounts for
            minors should be created and managed by a parent or guardian.
          </p>
        </section>

        <section>
          <h2 className="text-base font-semibold text-slate-900">
            10. Changes &amp; contact
          </h2>
          <p className="mt-1">
            We may update this policy and will post the revised date above.
            Continued use after changes means you accept the updated policy.
            Questions: use the contact details published on the site or your
            dashboard support channel.
          </p>
        </section>

        <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          <Link
            href="/terms"
            className="rounded-xl border border-slate-300 px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Read Terms &amp; Conditions
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
