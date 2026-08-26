import { redirect } from "next/navigation";
import { auth } from "./auth";
import { UserRole } from "./enums";
import type { Session } from "next-auth";

export async function requireSession(): Promise<Session> {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session;
}

export function assertRole(role: string | undefined, allowed: UserRole | UserRole[]): asserts role is UserRole {
  if (!role) throw new Error("No role in session");
  const allowedRoles = Array.isArray(allowed) ? allowed : [allowed];
  if (!allowedRoles.includes(role as UserRole)) {
    throw new Error("Insufficient permissions");
  }
}

export async function requireRole(roles: UserRole | UserRole[]): Promise<Session> {
  const session = await requireSession();
  assertRole(session.user.role, roles);
  return session;
}

export async function requireAdmin(): Promise<Session> {
  return requireRole(UserRole.ADMIN);
}

export async function requireDoctor(): Promise<Session> {
  return requireRole([UserRole.ADMIN, UserRole.DOCTOR]);
}

export async function requireFacilityManager(): Promise<Session> {
  return requireRole([UserRole.ADMIN, UserRole.FACILITY_ADMIN]);
}

