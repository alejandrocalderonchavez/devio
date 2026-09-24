import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rutas públicas que no requieren autenticación
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/marketplace") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/brand") ||
    pathname.includes(".");

  const authToken = request.cookies.get("devio_auth_token")?.value;
  const userRole = request.cookies.get("devio_user_role")?.value;
  const isClientUser = userRole === "Cliente" || authToken?.startsWith("devio_token_cli_");

  // Si el usuario es un Cliente e intenta acceder a rutas del backoffice (dashboard, projects, superadmin, settings, postventa)
  if (isClientUser && !pathname.startsWith("/portal") && !pathname.startsWith("/api") && !pathname.startsWith("/login") && !pathname.startsWith("/brand")) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  if (!isPublicRoute && !authToken) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if ((pathname === "/login" || pathname === "/register") && authToken) {
    if (request.nextUrl.searchParams.has("switch") || request.nextUrl.searchParams.has("logout")) {
      const response = NextResponse.next();
      response.cookies.delete("devio_auth_token");
      response.cookies.delete("devio_user_role");
      return response;
    }
    if (isClientUser) {
      return NextResponse.redirect(new URL("/portal", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand).*)",
  ],
};
