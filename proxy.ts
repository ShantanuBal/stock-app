import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "@/lib/session";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Redirect already-authenticated users away from the login page
  if (pathname.startsWith("/login")) {
    const token = req.cookies.get("horizon_session")?.value;
    const session = token ? await decrypt(token) : null;
    if (session) return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|opengraph-image).*)"],
};
