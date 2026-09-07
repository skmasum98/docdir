"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { DoctorClaimBanner } from "@/components/doctor-claim-banner";

function useIsOwner(doctorUserId: number | null): boolean {
  const { data: session } = useSession();
  return Boolean(
    session?.user &&
      doctorUserId !== null &&
      Number(session.user.id) === doctorUserId
  );
}

/** Shows the "claim this profile" banner to everyone except the owner. */
export function ClaimBannerGate({
  profileClaimed,
  doctorId,
  doctorName,
  doctorUserId,
}: {
  profileClaimed: boolean;
  doctorId: number;
  doctorName: string;
  doctorUserId: number | null;
}) {
  const isOwner = useIsOwner(doctorUserId);
  if (profileClaimed || isOwner) return null;
  return <DoctorClaimBanner doctorId={doctorId} doctorName={doctorName} />;
}

/** "Edit Profile" shortcut visible only to the profile owner. */
export function OwnerEditLink({ doctorUserId }: { doctorUserId: number | null }) {
  const isOwner = useIsOwner(doctorUserId);
  if (!isOwner) return null;
  return (
    <Link
      href="/dashboard"
      className="rounded-2xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
    >
      Edit Profile
    </Link>
  );
}
