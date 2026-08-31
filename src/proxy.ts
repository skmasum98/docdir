import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/dashboard", "/admin"];
const adminRoutes = ["/admin"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  if (!isProtected && !isAdminRoute) {
    // Add security headers to all responses
    const response = NextResponse.next();
    addSecurityHeaders(response);
    return response;
  }

  // Use the right cookie name based on environment.
  // In production (HTTPS), NextAuth uses the "__Secure-" prefix.
  const cookieName =
    process.env.NODE_ENV === "production"
      ? "__Secure-next-auth.session-token"
      : "next-auth.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Token.role is augmented via src/lib/next-auth.d.ts
  const role = (token as { role?: string }).role;

  if (isAdminRoute && role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  const response = NextResponse.next();
  addSecurityHeaders(response);
  return response;
}

function addSecurityHeaders(response: NextResponse) {
  // Security headers for production
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

  // HSTS - only over HTTPS in production
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  // Basic Content-Security-Policy. This is a starting point;
  // tighten for production based on actual needs (script-src, img-src, etc.)
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self' https:",
    "frame-src 'self' https://*.bkash.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
