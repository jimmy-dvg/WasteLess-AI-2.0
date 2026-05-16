import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { verifyToken } from "./src/lib/jwt";

const PUBLIC_PATHS = ["/", "/login", "/register", "/about", "/privacy", "/terms"];
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get("session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = verifyToken(token);
  if (!payload) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/app/:path*", "/profile/:path*", "/((?!api|_next|static|.*\\..*).*)"],
};
