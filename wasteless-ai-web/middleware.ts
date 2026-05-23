import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME } from "./src/lib/auth-constants";
import { verifyTokenEdge } from "./src/lib/jwt-edge";

const PUBLIC_PATHS = ["/", "/login", "/register", "/about", "/privacy", "/terms"];
const PUBLIC_PREFIXES = ["/_next", "/favicon.ico"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.includes(pathname) || PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const payload = await verifyTokenEdge(token);
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
